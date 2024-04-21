from pydub import AudioSegment
from pyannote.audio import Pipeline
import torch
import pandas as pd
import json
import whisper
import time

starttime=time.time()
transcriptionmodel=None
diarizationmodel=None
devide=None
#i think this should be more useful in the app.py file.
#refer :  https://stackoverflow.com/questions/61049310/how-to-avoid-reloading-ml-model-every-time-when-i-call-python-script
def load_models():
   global transcriptionmodel, diarizationmodel
   global device
   print("loading models..")
   access_token = "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"
   device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   transcriptionmodel= whisper.load_model('small.en', device = device)
   diarizationmodel = Pipeline.from_pretrained('pyannote/speaker-diarization-3.1', use_auth_token=access_token)


def transcribe_and_diarize():
  audio=input("Enter audio name : ")

  #prepending spacer since pyannote misses first the 0.5 seconds of audio
  spacermilli = 2000
  spacer = AudioSegment.silent(duration=spacermilli)
  audio = AudioSegment.from_wav(audio) 
  audio = spacer.append(audio, crossfade=0)
  audio.export('input.wav', format='wav')
  audio="./input.wav" #new input file

  #diarization diarizationmodel

  diarizationmodel.to(device)

  #diarizing
  print("diarizing..")
  diarized = diarizationmodel(audio)

  #formatting
  print("formatting..")
  segment_info_list=[]
  for speech_turn, track, speaker in diarized.itertracks(yield_label=True):
      segment_info={"start":speech_turn.start,
                    "end":speech_turn.end,
                    "speaker": speaker}
      segment_df=pd.DataFrame.from_dict({"":segment_info}, orient='index')
      segment_info_list.append(segment_df)

  all_segment_info=pd.concat(segment_info_list, axis=0)
  all_segment_info=all_segment_info.reset_index()

  #combining the same speaker's adjacent segments 
  combined_segment_info_list=[]
  prev_speaker=""
  record_len=len(all_segment_info)
  for i in range(record_len):
      inner=i
      start=all_segment_info.loc[i].start
      speaker=all_segment_info.loc[i].speaker
      if speaker==prev_speaker: continue
      while inner<record_len and all_segment_info.loc[inner].speaker==speaker:
          end=all_segment_info.loc[inner].end
          inner+=1
      combined_segment_info={'start':start,
                            'end':end,
                            'speaker':speaker}
      combined_segment_df=pd.DataFrame.from_dict({"":combined_segment_info}, orient='index')
      combined_segment_info_list.append(combined_segment_df)
      i=inner
      prev_speaker=speaker

  all_combined_segment_info=pd.concat(combined_segment_info_list, axis=0)
  all_combined_segment_info=all_combined_segment_info.reset_index()

  audio = AudioSegment.from_wav(audio)
  gidx = -1
  for _, record in all_combined_segment_info.iterrows():
    start = int(float(record[1]*1000))
    end = int(float(record[2]*1000))
    gidx += 1
    audio[start:end].export(str(gidx) + '.wav', format='wav')

  speaker_num=len(all_combined_segment_info.speaker.unique())
  
  print("transcribing..")
  all_combined_segment_info['words']=""
  for i in range(len(all_combined_segment_info)):
    audiof = str(i) + '.wav'
    result = transcriptionmodel.transcribe(audio=audiof, language='en', word_timestamps=True)
    all_combined_segment_info.loc[i, 'words']=result['text']

  result={"speaker_num":speaker_num, "transcript":(all_combined_segment_info.drop(columns=['index'])).to_dict(orient='records', index=4)}

  
  print("writing output to json..")
  with open('result.json', "w") as outfile:
    json.dump(result, outfile, indent=4)
  print("done!")

if __name__ == "__main__":
    print(("* Loading Keras model and Flask starting server..."
        "please wait until server has fully started"))
    load_models()
    transcribe_and_diarize()
    endtime=time.time()
    print((endtime-starttime)*1000, "ms")
#     app.run() 
# to be added in app.py
