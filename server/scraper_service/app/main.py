from flask import Flask, request, jsonify
import asyncio
from app.scraper import scrape

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "hello from scraper"}), 200

@app.route("/scrape", methods=["GET"])
def scrape_handler():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "Missing 'url' parameter"}), 400

    result = asyncio.run(scrape(url))

    # Extract the markdown content (assuming it's in `result.markdown`)
    markdown = result.markdown if hasattr(result, "markdown") else str(result)

    return jsonify({"markdown": markdown})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
