from speechmatics.models import ConnectionSettings
from speechmatics.batch_client import BatchClient
from httpx import HTTPStatusError

def summary():
    API_KEY = "8xjmuCBuXFsYlI88d8lq7GD0gdu5JUmk"
    PATH_TO_FILE = "../files/wildfire.mp3"
    LANGUAGE = "en" # Transcription language
    fd=open("summary.txt","w+")
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
        except HTTPStatusError as e:
            if e.response.status_code == 401:
                print('Invalid API key - Check your API_KEY at the top of the code!')
            elif e.response.status_code == 400:
                print(e.response.json()['detail'])
            else:
                raise e
    fd.flush()
    fd.close()