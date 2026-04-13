def detect_failure(accuracy, loss):
    if accuracy < 0.8 or loss > 0.5:
        return "FAILURE"
    return "OK"