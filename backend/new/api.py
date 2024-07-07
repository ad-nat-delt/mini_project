import flask
import os
from flask import jsonify
from flask import request

from speechmatics.models import ConnectionSettings
from speechmatics.batch_client import BatchClient
from httpx import HTTPStatusError

import instructor
from pydantic import BaseModel, Field
from typing import List
from openai import OpenAI
import datetime

api = flask.Flask(__name__)

@api.route('/')
def index():
    return jsonify(message="Index page", page="index")


# transcribe using whisper 
@api.route('/transcribe', methods=['POST'])
def transcribe():
    return jsonify(transcribe="Transcribe page")
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
def add_event_to_calendar():
    try:
        # Parse JSON data from request body
        data = request.get_json()
        
        # Example structure for event data
        class EventData(BaseModel):
            eventname: str
            date: str
            start_time: str
            end_time: str

        # Validate and parse event data
        event_data = EventData(**data)
        event_name = event_data.eventname
        event_date = event_data.date
        event_start_time = event_data.start_time
        event_end_time = event_data.end_time

        
        # Here you would integrate with your calendar API to add the event
        # Example pseudo-code (replace with actual calendar API integration):
        # calendar_api.add_event(event_name, event_date, event_start_time, event_end_time)

        msg = f"Event '{event_name}' added to calendar."
        return jsonify(message=msg, event_name=event_name, event_date=event_date, event_start_time=event_start_time, event_end_time=event_end_time)

    except Exception as e:
        return jsonify(message="Error adding event to calendar", error=str(e))

if __name__ == "__main__":
    api.run(debug=True, port=5000)
