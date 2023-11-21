from pytube import YouTube
import json
from flask import Flask, jsonify, request


app = Flask(__name__)


app.route('/video/<str:id>', methods=['GET'])
def genereateDownloadLink(video_url):
    """
        Function that generates download links with different qualities
        and returns the result as json.
    """
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
        return jsonify(links)
    except Exception as e:
        return jsonify({"error": str("")})


if __name__ == '__main__':
    """
        Starting point of website
    """
    app.run(host='0.0.0.0', port=5000)
