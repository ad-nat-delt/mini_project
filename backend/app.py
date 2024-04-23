import flask
from flask import request, jsonify, render_template
import json
# from transcription.transcribe import transcribe 
from summ_api.summ1 import summary as s
from event_extraction.task_main import get_all as g
import os 
from werkzeug.utils import secure_filename
from flask_cors import CORS


app = flask.Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})
app.config['UPLOAD_FOLDER'] = 'transcription'
app.config['UPLOAD_FOLDER1'] = 'summ_api'

@app.route('/')
def index():

    return jsonify(message="Index page", page="index")



@app.route('/summarize', methods=['GET', 'POST'])
def summarize():

    open('summ_api/summary.txt', 'w').close()
    file = request.files['audioData']
    extension = file.filename.split('.')[-1]
    if extension not in ['wav']:
        if extension in ['webm']:
            file.save(os.path.join(app.config['UPLOAD_FOLDER1'], 'audio.webm'))
            os.system(f"ffmpeg -i summ_api/audio.webm summ_api/audio2.wav")
    else:
            
        # # Generate a unique filename
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER1'], 'audio.wav'))
        
    summary = s()

    # Your processing logic here
    return jsonify(success= True, message = 'Text summarization completed...', summary = summary)

@app.route('/event', methods=['GET', 'POST'])
def event():
    file = request.files['audioData']
    
    # # Generate a unique filename
    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER1'], 'audio.wav'))
    
    # open('summ_api/summary.txt', 'w').close()

    summary = s() 
    print("Summary" , summary)
    summary = summary.replace('.', '.\n')
#     summary = """- The conversation involves a discussion about watching TV channels.
# - The meeting originally scheduled for tomorrow at 4:00 is proposed to be rescheduled to the day after tomorrow at 5:00 in the evening."""
    tasks,msg = g()
    # Your processing logic here
    return jsonify(summary = summary, success= True, message = 'Events extracted', msg = msg, tasks = tasks)


if __name__ == '__main__':
    app.run(debug=True)