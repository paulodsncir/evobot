import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import youtube from "youtube-sr";
import { i18n } from "../utils/i18n";
import { videoPattern, isURL, scRegex } from "../utils/patterns";

const { stream, video_basic_info } = require("play-dl");
import play from "play-dl"
import ytdl from "ytdl-core";
//import { stream, video_basic_info } from "play-dl"

export interface SongData {
  url: string;
  title: string;
  duration: number;
}

export class Song {
  public readonly url: string;
  public readonly title: string;
  public readonly duration: number;

  public constructor({ url, title, duration }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    
  }

  public static async from(url: string = "", search: string = "") {
    const isYoutubeUrl = videoPattern.test(url);
    const isSoundCloud = scRegex.test(url);
  


    let songInfo;


    //@ts-ignore
    play.setToken({
      soundcloud: {
        client_id: "xIJ58BvVuXifNTdPWBSey2YJz9snyV8J"
      }
    })


    if (isYoutubeUrl) {
      songInfo = await video_basic_info(url);

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title,
        duration: parseInt(songInfo.video_details.durationInSec)
      });
    } else {

      if (isSoundCloud) {

        songInfo = await play.soundcloud(url);

        return new this({
          //@ts-ignore
          url: songInfo.permalink,
          title: songInfo.name,
          duration:songInfo.durationInSec ,       
        });

      }

      const result = await youtube.searchOne(search);

      result ? null : console.log(`No results found for ${search}`);

      if (!result) {
        let err = new Error(`No search results found for ${search}`);

        err.name = "NoResults";

        if (isURL.test(url)) err.name = "InvalidURL";

        throw err;
      }

      songInfo = await video_basic_info(`https://youtube.com/watch?v=${result.id}`);

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title,
        duration: parseInt(songInfo.video_details.durationInSec)
      });
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    let playYoutube :any;
    let playSoundClound:any;

    let type = this.url.includes("youtube.com") ? StreamType.Opus : StreamType.OggOpus;

    const source = this.url.includes("youtube") ? "youtube" : "soundcloud";

    if (source === "youtube") {
      playYoutube =  ytdl(this.url, { filter: "audioonly", liveBuffer: 0, quality: "highestaudio" });;
      
    }

    if (source === "soundcloud") {
      
      let songInfoo = await play.soundcloud(this.url)
      //@ts-expect-error
      playSoundClound = await play.stream_from_info(songInfoo);
    }

    

    if (source === "youtube" && playYoutube) {
      return createAudioResource(playYoutube, { metadata: this, inlineVolume: true });
    }else{
      if (!stream) return;
      return createAudioResource(playSoundClound.stream, { metadata: this, inputType: playSoundClound.type, inlineVolume: true });
    }

   
  }

  public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }
}
