import whisperx
import pandas as pd
import json

device='cpu' #change to 'cuda' on gpu
batch_size=16
compute_type="int8" #change to 'float32' on gpu

def transcribe():
    audio_file="transcription/audio.wav"

    audio=whisperx.load_audio(audio_file)

    #diarization
    diarize_model=whisperx.DiarizationPipeline(use_auth_token="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", device=device)

    diarize_segments = diarize_model(audio)

    diarize_result = pd.DataFrame(diarize_segments[['speaker', 'start', 'end']])

    speaker_num=len(diarize_result.speaker.unique()) #number of speakers

    # transcription and word by word alignment
    align_model, metadata=whisperx.load_align_model(language_code='en', device=device)
    transcribe_model=whisperx.load_model("large-v2", device, compute_type=compute_type, language='en')


    transcribe_result=transcribe_model.transcribe(audio, batch_size=batch_size, language='en')

    wordalign_result=whisperx.align(transcribe_result["segments"], align_model, metadata, audio, device, return_char_alignments=False)
    wordalign_result=pd.DataFrame((wordalign_result['word_segments'])).drop(columns=['score'])

    sentence=diarize_result
    sentence['words']=""

    #combining word alignment and diarization
    for d_index, d_item in diarize_result.iterrows():
        index=d_index
        for a_index, a_item in wordalign_result.iterrows():
            if(a_item['start']>=d_item['start'] and a_item['end']<=d_item['end']):
                sentence.loc[index, 'words']=sentence.loc[index, 'words']+a_item['word']+" "

    result={"number_of_speakers":speaker_num, "transcript":(sentence.to_dict(orient='records', index=4))}

    with open("result.json", "w") as f:
        json.dump(result, f, indent=4)
    
    return json.dump(result, f, indent=4)

