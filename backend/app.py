import flask
from flask import request, jsonify, render_template
import json
# from transcription.transcribe import transcribe 
from summ_api.summ1 import summary as s
from event_extraction.task_main import get_all as g
import os 
from werkzeug.utils import secure_filename


app = flask.Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'transcription'
app.config['UPLOAD_FOLDER1'] = 'summ_api'

@app.route('/')
def index():

    return render_template('index.html', message="Index page", page="index")



# @app.route('/transcribe', methods=['GET', 'POST'])
# def transcribe():
#     try:
#         # clear a file
#         open('transcription/a.txt', 'w').close()
#         file = request.files['audioData']
        
#         # # Generate a unique filename
#         filename = secure_filename(file.filename)
#         file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'audio.wav'))
#         file.save(os.path.join(app.config['UPLOAD_FOLDER1'], 'audio.wav'))
        
    
#         # Your processing logic here
#         # text = transcribe()
#         text = "Hello World!"   
#         # Return a success response or error response
#         return render_template("transcription.html",success= True, message = 'Audio processing completed.', transcription = text)
#     except Exception as e:
#         return render_template("transcription.html",success= False, message = e, transcription = None)


@app.route('/summarize', methods=['GET', 'POST'])
def summarize():

    open('summ_api/summary.txt', 'w').close()
    file = request.files['audioData']
    
    # # Generate a unique filename
    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER1'], 'audio.wav'))
    
    summary = s()

    # Your processing logic here
    return render_template("summarize.html",success= True, message = 'Text summarization completed...', summary = summary)

@app.route('/event', methods=['GET', 'POST'])
def event():
    file = request.files['audioData']
    
    # # Generate a unique filename
    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER1'], 'audio.wav'))
    
    summary = s()
    tasks,msg = g()
    # Your processing logic here
    return render_template("event.html",success= True, message = 'Tasks extracted', msg = msg, tasks = tasks)
if __name__ == '__main__':
    app.run(debug=True)