import flask
import os
from flask import jsonify, request
from flask_cors import CORS
from speechmatics.models import ConnectionSettings
from speechmatics.batch_client import BatchClient
from httpx import HTTPStatusError
from datetime import datetime, timedelta, date
from werkzeug.utils import secure_filename

from pydub import AudioSegment
from pyannote.audio import Pipeline
import torch
import json
import whisper  # Assuming this is a module you use for transcription

from pydantic import BaseModel, Field
from typing import List
import instructor
from openai import OpenAI

# Global variables for models and device
transcriptionmodel = None
diarizationmodel = None
device = None

api = flask.Flask(__name__)
CORS(api, resources={r"/*": {"origins": "*"}})

@api.route('/')
def index():
    return jsonify(message="Index page", page="index")

# Function to load models
def load_models():
    global transcriptionmodel, diarizationmodel, device
    try:
        print("Loading models...")
        access_token = os.getenv('AUTH_TOKEN', 'auth_token_here')  # Replace with your access token if applicable
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        transcriptionmodel = whisper.load_model('small.en', device=device)
        diarizationmodel = Pipeline.from_pretrained('pyannote/speaker-diarization-3.1', use_auth_token=access_token)
    except Exception as e:
        print(f"Error loading models: {e}")
        raise

# Function to transcribe and diarize audio
def transcribe_and_diarize(audio_path):
    try:
        # Prepend spacer since pyannote misses the first 0.5 seconds of audio
        spacer_milliseconds = 500
        spacer = AudioSegment.silent(duration=spacer_milliseconds)
        audio = AudioSegment.from_file(audio_path, format='wav')
        audio_with_spacer = spacer + audio
        audio_with_spacer.export('input.wav', format='wav')

        # Diarization
        print("Diarizing...")
        diarized = diarizationmodel('input.wav')

        # Formatting diarization results
        print("Formatting...")
        segment_info_list = []
        for speech_turn, track, speaker in diarized.itertracks(yield_label=True):
            segment_info = {
                "start": speech_turn.start,
                "end": speech_turn.end,
                "speaker": str(speaker)  # Ensure speaker is converted to string
            }
            segment_info_list.append(segment_info)

        # Transcription
        print("Transcribing...")
        transcript_results = []
        for idx, segment_info in enumerate(segment_info_list):
            start_ms = int(segment_info['start'] * 1000)
            end_ms = int(segment_info['end'] * 1000)
            segment_audio = audio[start_ms:end_ms]
            segment_audio.export(f'{idx}.wav', format='wav')
            result = transcriptionmodel.transcribe(audio=f'{idx}.wav', language='en', word_timestamps=True)
            transcript_results.append({
                "speaker": segment_info['speaker'],
                "transcript": result['text']
            })

        # Prepare final result
        result = {
            "speaker_num": len(diarized.get_timeline().tracks),
            "transcript": transcript_results
        }

        return result
    except Exception as e:
        print(f"Error in transcribe_and_diarize: {e}")
        raise

# Route for uploading audio file and processing
@api.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify(message="No file part"), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify(message="No selected file"), 400

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(filename)
        file.save(file_path)
        try:
            load_models()
            result = transcribe_and_diarize(file_path)
            return jsonify(result=result), 200
        except Exception as e:
            return jsonify(message=f"Error processing file: {str(e)}"), 500

@api.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        AUTH_TOKEN = os.getenv('SPEECH_API')
        
        # Check if file is present in the request
        if 'file' not in request.files:
            return jsonify(message="No file part")

        file = request.files['file']
        
        # Check if the file is empty
        if file.filename == '':
            return jsonify(message="No selected file")

        audio = file.read()
        audio_name = file.filename
        
        # save the audio file
        with open(audio_name, 'wb') as f:
            f.write(audio)
        
        path = os.path.abspath(audio_name)
        LANGUAGE = 'en'
        
        settings = ConnectionSettings(
            url='https://asr.api.speechmatics.com/v2',
            auth_token=AUTH_TOKEN,
        )

        conf = {
            "type": "transcription",
            "transcription_config": {
                "language": LANGUAGE,
                "enable_entities": True,
            },
        }

        with BatchClient(settings) as client:
            try:
                job_id = client.submit_job(audio=path, transcription_config=conf)
                print(f'Job ID: {job_id}')

                transcript = client.wait_for_completion(job_id, transcription_format='txt')
                
                # save it in a file transcript.txt
                with open('transcription.txt', 'w') as f:
                    f.write(transcript)
                return jsonify(transcript=transcript)
            
            except HTTPStatusError as e:
                print(f'HTTPStatusError: {e}')
                return jsonify(message="Error", error=str(e))
            
            except Exception as e:
                print(f'Error: {e}')
                return jsonify(message="Error", error=str(e))
    
    except Exception as e:
        return jsonify(message="Error", error=str(e))

@api.route('/summarize', methods=['POST'])
def summarize():
    try:
        AUTH_TOKEN = os.getenv('SPEECH_API')
        
        # Check if file is present in the request
        if 'file' not in request.files:
            return jsonify(message="No file part")

        file = request.files['file']
        
        # Check if the file is empty
        if file.filename == '':
            return jsonify(message="No selected file")

        audio = file.read()
        audio_name = file.filename
        
        # save the audio file
        with open(audio_name, 'wb') as f:
            f.write(audio)
        
        path = os.path.abspath(audio_name)
        LANGUAGE = 'en'
        
        settings = ConnectionSettings(
            url='https://asr.api.speechmatics.com/v2',
            auth_token=AUTH_TOKEN,
        )

        conf = {
            "type": "transcription",
            "transcription_config": {
                "language": LANGUAGE,
            },
            "summarization_config": {}
        }

        with BatchClient(settings) as client:
            try:
                job_id = client.submit_job(audio=path, transcription_config=conf)
                print(f'Job ID: {job_id}')

                transcript = client.wait_for_completion(job_id, transcription_format='json-v2')
                sumarry = transcript['summary']['content']
                # save it in a file summary.txt
                with open('summary.txt', 'w') as f:
                    f.write(sumarry)
                return jsonify(summary=sumarry)
            
            except HTTPStatusError as e:
                print(f'HTTPStatusError: {e}')
                return jsonify(message="Error", error=str(e))
            
            except Exception as e:
                print(f'Error: {e}')
                return jsonify(message="Error", error=str(e))
    
    except Exception as e:
        return jsonify(message="Error", error=str(e))

# get the events from summary 
@api.route('/events', methods=['GET'])
def events():
    current = datetime.date.today()
    now = datetime.datetime.now()

    hour = (now.hour + 1) % 24  # Using modulo operator to ensure hour stays within 0-23 range
    time_details = f"{hour:02}:00:00"  # Ensuring two-digit format for hour
    print(time_details)

    print("Today's date:", current)   
    print("Current time:", time_details)

    # Define your desired output structure
    class UserInfo(BaseModel):
        name: str
        age: int

    api_key = os.getenv("OPENAI_API")

    # Patch the OpenAI client
    client = instructor.from_openai(OpenAI(
        api_key=api_key,
        timeout=20000,
        max_retries=3
    ))

    file = open('summary.txt', 'r')
    summary = file.read()
    file.close()
    summary = f"""
    Current date {current}, current time {time_details}
    {summary}
    """

    if "morning" in summary.lower():
        summary = summary.replace("morning", "08:00:00")
    if "noon" in summary.lower():
        summary = summary.replace("noon", "12:00:00")
    if "evening" in summary.lower():
        summary = summary.replace("evening", "16:00:00")
    if "today" in summary:
        summary = summary.replace("today", str(current))
    if "tomorrow" in summary:
        tmmr =  str(datetime.date.today() + datetime.timedelta(days=1))
        summary = summary.replace("tomorrow", tmmr )


    class TimeV(BaseModel):
        hours: str = Field(default= str(hour), description="Hour of the event (24-hour format) 00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23")
        minutes: str = Field(default= "00", description="Minutes of the event round to nearest 5 multiple")
        seconds: str = Field(default= "00", description="Return 00")


    default_time = TimeV(hours= f"{hour:02}", minutes="00", seconds="00")

    class TimeDetails(BaseModel):
        date: str = Field(default= current, description="Date of the event") 
        start_time: TimeV = Field(default= default_time, description="Start time of the event")
        end_time: TimeV = Field(default= default_time, description="End time of the event")

    class TaskDetails(BaseModel):
        eventname: str = Field(default="Event", description="Title or summary of the event")
        timeline: TimeDetails = Field(default= None, description="Date and time details")

    class MultipleTaskData(BaseModel):
        tasks: List[TaskDetails]

    # Extract structured data from natural language
    user_info = client.chat.completions.create(
        model="gpt-3.5-turbo",
        response_model=MultipleTaskData,
        messages=[{"role": "user", "content": f"Please convert the following information into valid JSON representing the event details: {summary} specifically for assigning each task to google calender api."}],
    )
    # print(json.dumps(user_info.model_dump(), indent=1))

    tasks = user_info.dict()["tasks"]
    t_task = dict()
    if len(tasks) != 0:
        for task in tasks:
            if task["timeline"]["start_time"]["hours"] == task["timeline"]["end_time"]["hours"] and task["timeline"]["start_time"]["minutes"] == task["timeline"]["end_time"]["minutes"] :
                task["timeline"]["end_time"]["minutes"] = "30"
            if int(task["timeline"]["start_time"]["hours"]) > int(task["timeline"]["end_time"]["hours"]):
                task["timeline"]["end_time"]["hours"] = str(int(task["timeline"]["start_time"]["hours"]))
                task["timeline"]["end_time"]["minutes"] = "30"
            if int(task["timeline"]["start_time"]["hours"]) == int(task["timeline"]["end_time"]["hours"]) and int(task["timeline"]["start_time"]["minutes"]) > int(task["timeline"]["end_time"]["minutes"]):
                task["timeline"]["start_time"]["minutes"] = "00"
                task["timeline"]["end_time"]["minutes"] = "30"
            print("Event name:", task["eventname"])
            event_name = task["eventname"]
            print("Date:", task["timeline"]["date"])
            date = task["timeline"]["date"]
            print("Start time: ",task["timeline"]["start_time"]["hours"]+":"+task["timeline"]["start_time"]["minutes"]+":"+task["timeline"]["start_time"]["seconds"])
            start_time = task["timeline"]["start_time"]["hours"]+":"+task["timeline"]["start_time"]["minutes"]+":"+task["timeline"]["start_time"]["seconds"]
            print("End time: ",task["timeline"]["end_time"]["hours"]+":"+task["timeline"]["end_time"]["minutes"]+":"+task["timeline"]["end_time"]["seconds"])
            end_time = task["timeline"]["end_time"]["hours"]+":"+task["timeline"]["end_time"]["minutes"]+":"+task["timeline"]["end_time"]["seconds"]
            print("\n")
        
        msg = "Event creation completed."
        return jsonify(tasks=tasks, message=msg)   
    else:
        msg = "No event found."
        return jsonify(message=msg)

@api.route('/addevent', methods=['POST'])
def addevent():
    try:
        data = request.get_json()
        event_name = data["eventname"]
        date = data["date"]
        start_time = data["start_time"]
        end_time = data["end_time"]

        run(summary=event_name, start_time=f"{date}T{start_time}", end_time=f"{date}T{end_time}", description="Automated by ...")
        return jsonify(message="Event added to calendar")

    except Exception as e:
        print(f"Error: {e}")
        return jsonify(message="Error adding event to calendar", error=str(e)), 500

if __name__ == "__main__":
    api.run(debug=True, port=5000)
