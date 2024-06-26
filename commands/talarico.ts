import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { playlistPattern } from "../utils/patterns";

export default {
  data: new SlashCommandBuilder()
    .setName("talarico")
    .setDescription(i18n.__("A história de um talarico")),
  cooldown: 3,
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages
  ],
  async execute(interaction: ChatInputCommandInteraction) {
    const url = "https://soundcloud.com/gorduradj/talarico-mc-gorila-e-gordura-dj?ref=whatsapp&p=i&c=1&si=2980FA157DE849E1B7788647E7AF991A";

    let argSongName = url;
    if (!argSongName) argSongName = url;

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    if (!channel)
      return interaction.reply({ content: i18n.__("play.errorNotChannel"), ephemeral: true }).catch(console.error);

    const queue = bot.queues.get(interaction.guild!.id);

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return interaction
        .reply({
          content: i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username }),
          ephemeral: true
        })
        .catch(console.error);
   

    if (interaction.replied) await interaction.editReply("⏳ Loading...").catch(console.error);
    else await interaction.reply("⏳ Loading...");

    // Start the playlist if playlist url was provided
    if (playlistPattern.test(url)) {
      await interaction.editReply("🔗 Link is playlist").catch(console.error);

      return bot.slashCommandsMap.get("playlist")!.execute(interaction, "song");
    }

    let song;

    try {
      song = await Song.from(url, url);
    } catch (error: any) {
      console.error(error);

      if (error.name == "NoResults")
        return interaction
          .reply({ content: i18n.__mf("play.errorNoResults", { url: `<${url}>` }), ephemeral: true })
          .catch(console.error);

      if (error.name == "InvalidURL")
        return interaction
          .reply({ content: i18n.__mf("play.errorInvalidURL", { url: `<${url}>` }), ephemeral: true })
          .catch(console.error);

      if (interaction.replied)
        return await interaction.editReply({ content: i18n.__("common.errorCommand") }).catch(console.error);
      else return interaction.reply({ content: i18n.__("common.errorCommand"), ephemeral: true }).catch(console.error);
    }

    if (queue) {
      queue.enqueue(song);

      return (interaction.channel as TextChannel)
        .send({ content: i18n.__mf("play.queueAdded", { title: song.title, author: interaction.user.id }) })
        .catch(console.error);
    }

    const newQueue = new MusicQueue({
      interaction,
      textChannel: interaction.channel! as TextChannel,
      connection: joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
      })
    });

    bot.queues.set(interaction.guild!.id, newQueue);

    newQueue.enqueue(song);
    interaction.deleteReply().catch(console.error);
  }
};
