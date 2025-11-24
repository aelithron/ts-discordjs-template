import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Command } from './bot.js';
dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
if (!token) {
  console.error("[cmd-deploy] No TOKEN provided! Make sure to add a Discord bot token to your environment variables.");
	process.exit(1);
}
if (!clientId) {
  console.error("[cmd-deploy] No CLIENT_ID provided! Make sure to add a Discord bot client ID to your environment variables.");
	process.exit(1);
}

const commands: import('discord.js').Collection<string, Command>[] = [];
const foldersPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import(pathToFileURL(filePath).href);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.warn(`[cmd-deploy] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);
(async () => {
	try {
		console.log(`[cmd-deploy] Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`[cmd-deploy] Successfully reloaded ${(data as any).length} application (/) commands.`);
	} catch (error) {
		console.error("[cmd-deploy]", error);
	}
})();