import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import dotenv from "dotenv";
import type { ClientWithCommands, Command } from './bot.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
dotenv.config({ quiet: true });

const client: Client<boolean> = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, (readyClient: Client<true>) => {
	console.log(`[bot] Ready - Logged in (${readyClient.user.tag})`);
});

if (!process.env.TOKEN || process.env.token === "") {
  console.error("[bot] No TOKEN provided! Make sure to add a Discord bot token to your environment variables.");
  process.exit(1);
}
client.login(process.env.TOKEN);

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = (interaction.client as ClientWithCommands).commands.get(interaction.commandName);
    if (!command) {
      console.error(`[bot] No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const command = (interaction.client as ClientWithCommands).commands.get(interaction.commandName);
    if (!command) {
      console.error(`[bot] No command matching ${interaction.commandName} was found.`);
      return;
    }
    if (!command.autocomplete) {
      console.error(`[bot] Command ${interaction.commandName} does not have an autocomplete function.`);
      return;
    }
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands: Collection<string, Command> = new Collection();
  const foldersPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(pathToFileURL(filePath).href);
      if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
      } else {
        console.warn(`[bot] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
  return commands;
}