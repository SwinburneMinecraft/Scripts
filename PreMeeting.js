// Load environment variables from .env file
import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();

// Define a Discord bot class
class DiscordBot
{
    constructor()
    {
        // Create a Discord client with specified intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.DirectMessages
            ]
        });

        // Start the bot
        this.startBot();
    }

    // Method to start the bot
    startBot()
    {
        try
        {
            // Log in the Discord bot using the provided token
            this.client.login(process.env.DISCORD_TOKEN);
            // Listen for the 'ready' event
            this.client.on('ready', this.handleReady.bind(this));
        } catch (error)
        {
            console.error("An error occurred:", error);
        }
    }

    // Event handler for the 'ready' event
    async handleReady()
    {
        // Start calculating the moving average with a specified number of days
        this.startCalculatingMovingAverage(14); // Number of days for moving average
        // Get new suggestions using the current date as the cutoff
        this.getNewSuggestions(new Date()); // Cutoff date for new suggestions
    }

    // Method to get new suggestions based on a cutoff date
    async getNewSuggestions(cutoffDate)
    {
        // Add your new suggestions logic here
        // Use the provided cutoff date to retrieve and process new suggestions
    }

    // Method to start calculating the moving average
    async startCalculatingMovingAverage(movingAverageDays)
    {
        try
        {
            // IDs of the target guild and channel
            const guildId = "1084629233248260126";
            const channelId = "1129359331805106256";

            // Get the guild and channel objects
            const guild = this.client.guilds.cache.get(guildId);
            const channel = guild.channels.cache.get(channelId);

            // Initialize an object to store unique users by day
            const uniqueUsersByDay = {};

            // Calculate the cutoff date (days ago)
            const cutoffDate = this.calculateCutoffDate(movingAverageDays);

            // Fetch messages until the cutoff date and process them
            await this.fetchMessagesUntilDate(channel, cutoffDate, (message) =>
            {
                this.processMessage(uniqueUsersByDay, message, cutoffDate);
            });

            // Calculate the unique user counts and moving average
            const uniqueUserCounts = Object.values(uniqueUsersByDay).map(set => set.size);
            const movingAverage = this.calculateMovingAverage(uniqueUserCounts, movingAverageDays);

            // Log the results
            console.log("Unique users joined per day:", uniqueUserCounts);
            console.log(`${movingAverageDays}-day moving average:`, movingAverage);

        } catch (error)
        {
            console.error("An error occurred:", error);
        }
    }

    // Method to fetch messages until a specified date
    async fetchMessagesUntilDate(channel, targetDate, processMessageCallback)
    {
        let lastMessageId = null;
        let shouldContinue = true;

        while (shouldContinue)
        {
            const messages = await channel.messages.fetch({
                limit: 100,
                before: lastMessageId
            });

            shouldContinue = await this.processMessages(messages, targetDate, processMessageCallback);

            lastMessageId = messages.last()?.id;
        }
    }

    // Method to process messages and check if they should be processed
    async processMessages(messages, targetDate, processMessageCallback)
    {
        let shouldContinue = true;

        for (const message of messages.values())
        {
            const messageDate = new Date(message.createdAt);

            if (messageDate >= targetDate)
            {
                await processMessageCallback(message);
            } else
            {
                shouldContinue = false; // Stop processing if the message date is before the target date
                break;
            }
        }

        return shouldContinue;
    }

    // Method to process a single message
    async processMessage(uniqueUsersByDay, message, cutoffDate)
    {
        const embed = message.embeds[0];
        if (embed && embed.author && embed.author.name.includes("joined"))
        {
            const username = embed.author.name.split(" joined the server!")[0];
            const embedDateStr = new Date(message.createdAt).toLocaleDateString();

            // Parse the embedDateStr to a Date object in the format 'dd/mm/yyyy'
            const parts = embedDateStr.split('/');
            const embedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

            if (embedDate >= cutoffDate)
            {
                uniqueUsersByDay[embedDateStr] = uniqueUsersByDay[embedDateStr] || new Set();
                uniqueUsersByDay[embedDateStr].add(username);
            }
        }
    }

    // Method to calculate the cutoff date
    calculateCutoffDate(daysAgo)
    {
        // Calculate the cutoff date based on the specified number of days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        return cutoffDate;
    }

    // Method to calculate the moving average
    calculateMovingAverage(values, numDays)
    {
        // Calculate the moving average for the specified number of days
        if (values.length < numDays)
        {
            return null; // Not enough data for the specified number of days
        }

        const sum = values.slice(-numDays).reduce((acc, value) => acc + value, 0);
        return sum / numDays;
    }
}

// Create an instance of the DiscordBot class to start the bot
const bot = new DiscordBot();
