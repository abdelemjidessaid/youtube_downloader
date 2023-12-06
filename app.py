#!/usr/bin/python3

from pytube import YouTube
import json
from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app, origins=["http://localhost:5000", "http://100.26.171.172"])


@app.route('/video/<video_id>', methods=['GET'])
def genereateDownloadLink(video_id):
    """
        Function that generates download links with different qualities
        and returns the result as json.
    """
    video_url = "https://www.youtube.com/watch?v=" + video_id
    try:
        result = YouTube(video_url)
        streams = result.streams
        links = []
        for stream in streams:
            stream_json = {
                "resolution": stream.resolution,
                "mime_type": stream.mime_type,
                "type": stream.type,
                "url": stream.url
            }
            links.append(stream_json)
        res = jsonify({"resolutions": links})
        res.headers.add("Access-Control-Allow-Origin", "*")
        return res
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    """
        Starting point of website
    """
    app.url_map.strict_slashes = False
    app.run(host='0.0.0.0', port=5000)

