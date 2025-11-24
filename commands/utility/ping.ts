import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription(`Checks the bot's ping`);
export async function execute(interaction: CommandInteraction) {
	const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });
	if (!sent.resource?.message) {
		await interaction.editReply(`Pong!\n-# Websocket Ping: ${interaction.client.ws.ping}ms\n-# Roundtrip Latency: unknown`);
		return;
	}
	await interaction.editReply(`Pong!\n-# Websocket Ping: ${interaction.client.ws.ping}ms\n-# Roundtrip Latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`);
};