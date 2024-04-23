from speechmatics.models import ConnectionSettings
from speechmatics.batch_client import BatchClient
from httpx import HTTPStatusError

import os 
def summary():
    API_KEY = "A7jzIMDAZLILDP6KqgwE351Pc9Gutm7R"
    
    PATH_TO_FILE = "summ_api/audio.wav"
    LANGUAGE = "en" # Transcription language
    fd=open("summ_api/summary.txt","w+")
    settings = ConnectionSettings(
        url="https://asr.api.speechmatics.com/v2",
        auth_token=API_KEY,
    )

    # Define transcription parameters
    conf = {
        "type": "transcription",
        "transcription_config": {
            "language": LANGUAGE
        },
        "summarization_config": {}  # You can also configure the summary. See below for more detail.
    }

    # Open the client using a context manager
    with BatchClient(settings) as client:
        try:
            job_id = client.submit_job(
                audio=PATH_TO_FILE,
                transcription_config=conf,
            )
            # print(f'job {job_id} submitted successfully, waiting for transcript')

            # Note that in production, you should set up notifications instead of polling.
            # Notifications are described here: https://docs.speechmatics.com/features-other/notifications
            transcript = client.wait_for_completion(job_id, transcription_format='json-v2')
            summary = transcript["summary"]["content"]
            fd.write(summary)
            # print(summary)
            return summary

        except HTTPStatusError as e:
            if e.response.status_code == 401:
                return 'Invalid API key - Check your API_KEY at the top of the code!'
            elif e.response.status_code == 400:
                print(f"Error: {e.response.json()['error'   ]}")
                return f"{e.response.json()}"
            else:
                raise e
            return "Error occurred while processing the audio file. Please try again."
    fd.flush()
    fd.close()

# summary()