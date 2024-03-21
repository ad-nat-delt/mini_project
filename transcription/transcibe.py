from faster_whisper import WhisperModel
def transcribe():
    model_size = "large-v3"

    # Run on GPU with FP16
    # model = WhisperModel(model_size, device="cuda", compute_type="float16")

    # or run on GPU with INT8
    # model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")
    # or run on CPU with INT8
    fd = open("a.txt", "w+")

    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe("20230607_me_canadian_wildfires(1).mp3", beam_size=5)

    print("Detected language '%s' with probability %f" % (info.language, info.language_probability))

    for segment in segments:
        print("%s" % (segment.start, segment.end, segment.text))
        fd.write("%s\n" % segment.text)
    fd.flush()
    fd.close()