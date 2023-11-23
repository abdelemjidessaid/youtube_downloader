const api_key = 'AIzaSyBrqhS5UfxUEN5efHwgIqYfOnA4p_7IeOU';
const video_url = `https://www.googleapis.com/youtube/v3/videos?key=${api_key}`;
const playlistItems_url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${api_key}`;
const playlists_url = `https://www.googleapis.com/youtube/v3/playlists?key=${api_key}`;

let mode = 'video';

$(document).ready(function () {
  /**
   * function that initialises our script when page is ready
   *
   * Description:
   *    when page of website is ready it will call this function,
   *    then our input and buttons it will be initialised.
   */
  $('.landing .url-section .search-button').on('click', function () {
    const url = $('.landing .url-section .search-input').val();

    if (mode === 'video') {
      const video_id = getVideoId(url);
      if (!video_id) {
        alert('This video URL is invalid!');
        return;
      }
      fetchVideo(video_id).then(() => {
        getResolutions(video_id);
      });
    } else if (mode === 'playlist') {
      const playlist_id = getPlaylistId(url);
      if (!playlist_id) {
        alert('This playlist URL is invalid!');
        return;
      }
      showLoading();
      fetchPlaylistVideos(playlist_id)
        .then((videos) => {
          fetchPlaylistData(playlist_id)
            .then((info) => {
              hideLoading();
              info['count'] = videos.length;
              displayPlaylistData(info);
            })
            .catch((error) => {
              hideLoading();
              alert(error);
            });
        })
        .catch((error) => {
          hideLoading();
          console.log(error);
        });
    }
  });

  // get the selected mode
  $('.landing .url-section .download-type').change(() => {
    mode = $('.landing .url-section .download-type').val();
  });
});

async function fetchVideo(video_id) {
  /**
   * function that fetches the data of a video
   * @video_id: the id of video.
   */
  try {
    showLoading();
    const url = `${video_url}&part=snippet&id=${video_id}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const o = {
        title: data.items[0].snippet.title,
        channelName: data.items[0].snippet.channelTitle,
        thumbnail: data.items[0].snippet.thumbnails.medium.url,
      };
      displayVideoData(o);
      hideLoading();
    } else {
      hideLoading();
      alert('Something went wrong !\nPlease check the URL you entered');
    }
  } catch (error) {
    hideLoading();
    console.error(error);
  }
}

async function fetchPlaylistVideos(playlist_id) {
  /**
   * function that returns a list of playlist videos
   * @playlist_id: id of playlist.
   *
   * Return: list of all playlist videos data.
   */
  const playlist = `${playlistItems_url}&part=snippet&playlistId=${playlist_id}&maxResult=50`;
  const videos = [];
  let nextToken = null;

  try {
    do {
      let newUrl = playlist;
      if (nextToken) newUrl = `${playlist}&pageToken=${nextToken}`;

      const response = await fetch(newUrl);
      if (response.ok) {
        const data = await response.json();

        videos.push(...data.items);
        nextToken = data.nextPageToken;
      } else {
        return null;
      }
    } while (nextToken);

    return videos;
  } catch (error) {
    alert(error);
  }
}

async function fetchPlaylistData(playlist_id) {
  /**
   * function that fetches data about a playlist like:
   *    - playlist title
   *    - number of videos that contains
   *    - channel name
   *    - playlist thumbnail
   *
   * @playlist_id: the id of playlist
   *
   * Return: an object that contains all data required, null otherwise.
   */

  try {
    const url = `${playlists_url}&part=snippet&id=${playlist_id}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const o = {
        title: data.items[0].snippet.title,
        channelName: data.items[0].snippet.channelTitle,
        thumbnail: data.items[0].snippet.thumbnails.medium.url,
      };
      return o;
    } else {
      alert('Something went wrong !');
    }
  } catch (error) {
    console.error(error);
  }
}

function getVideoId(url) {
  /**
   * function that returns the video id from video url
   * @video_url: the full url of video
   *
   * Return: ID of video, null otherwise
   */
  var pattern = /(?:[?&]|\b)v=([a-zA-Z0-9_-]{11})(?:\S+)?/;
  var match = url.match(pattern);
  if (match && match.length > 1) {
    return match[1];
  } else {
    return null;
  }
}

function getPlaylistId(url) {
  /**
   * function that returns the id of a playlist from the given url
   * @url: the url of playlist
   * Return: the ID of playlist, null otherwise
   */
  const playlistRegex = /(?<=list=)([a-zA-Z0-9_-]+)/;
  const matches = url.match(playlistRegex);

  if (matches && matches.length > 0) {
    return matches[0];
  }

  return null;
}

async function getResolutions(video_id) {
  /**
   * function that fetch data that contains resolution from back-end
   * @video_id: the id of video
   */

  const api = `http://100.26.171.172/video/${video_id}`;
  await fetch(api)
    .then((response) => response.json())
    .then((data) => {
      const res = data.resolutions;
      videos = res.filter((r) => r.type === 'video');
      audios = res.filter((r) => r.type === 'audio');
      //downloadVideo(videos[0].url, 'video.mp4', 1, 1);
      download(videos[0]).url;
    })
    .catch((err) => {
      alert(err);
    });
}

function download(url) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'filename.mp4';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

async function downloadVideo(url, fileName, index, count) {
  /**
   * function that downloads videos with specific names.
   * @url: the download url
   * @fileName: the name to save the file with
   * @index: the index of video in a playlist
   * @count: the number of videos in a playlist
   */

  const chunks = [];

  fetch(url)
    .then((response) => {
      const reader = response.body.getReader();
      const length = response.headers.get('content-length');
      let downloaded = 0;

      // add the attribute of disabled to the download button

      function readData() {
        return reader.read().then((result) => {
          if (result.value) {
            chunks.push(result.value);
            downloaded += result.value.length;
            const percent = Math.floor((downloaded / length) * 100);
            progress(percent, index, count);
          }

          if (!result.done) return readData();
        });
      }

      return readData();
    })
    .then(() => {
      const anchor = document.createElement('a');
      const blob = new Blob(chunks);
      anchor.href = URL.createObjectURL(blob);
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    })
    .catch((err) => {
      console.log(err);
      // remove the attribute of disabled
    })
    .finally(() => {
      // remove the attribute of disabled
    });
}

function displayVideoDetails(title, channelName) {
  /**
   * function that displays details of video in our page
   * @title: the video title
   * @channelName: the channel name
   */
  const parent = $('.landing .video-section .data');
  const titleElement = $('.landing .video-section .data .title');
  const channelElement = $('.landing .video-section .data .channel-name');
  titleElement.remove();
  channelElement.remove();
  const heading = $(`<h3 class="title">${title}</h3>`);
  const paragraph = $(`<p class="channel-name">${channelName}</p>`);
  parent.prepend(paragraph);
  parent.prepend(heading);
}

function displayVideoData(data) {
  /**
   * function that renders HTML tags to display video data in our page
   * @data: object contains: thumbnail, title, channelName
   */

  const element = `
  <section class="video-section">
    <img class="cover" src="${data.thumbnail}"/>
    <div class="data">
      <h3 class="title">${data.title}</h3>
      <p class="channel-name">${data.channelName}</p>
    </div>
  </section>
  `;

  // remove the old section of exists
  $('.landing .content .container .video-section').remove();
  // add the new section
  $('.landing .content .container').append(element);
}

function displayPlaylistData(data) {
  /**
   * function that renders HTML tags to display playlist data in our page
   * @data: object contains: thumbnail, title, channelName, videoCount
   */

  const element = `
  <section class="video-section">
    <img class="cover" src="${data.thumbnail}"/>
    <div class="data">
      <h3 class="title">${data.title}</h3>
      <p class="channel-name">${data.channelName}</p>
      <p class="playlist-items">${data.count} Video${
    data.count > 1 ? 's' : ''
  }</p>
    </div>
  </section>
  `;

  // remove the old section of exists
  $('.landing .content .container .video-section').remove();
  // add the new section
  $('.landing .content .container').append(element);
}

function progress(percent, index, total) {
  const template = `
  <div class="container">
    <p class="file-count">File ${index}/${total}</p>
    <div class="progress-bar">
      <span class="progress" style="width: ${percent}%"></span>
      <span class="percentage">${percent} %</span>
    </div>
  </div>
  `;

  $('.landing section.download .container').remove();
  $('.landing section.download .container').append(template);

  if (percent === 100) $('.landing section.download .container').remove();
}

function showLoading() {
  $('.wait-alert').css('display', 'block');
}

function hideLoading() {
  $('.wait-alert').css('display', 'none');
}
