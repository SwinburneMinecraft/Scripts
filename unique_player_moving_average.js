// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Import required modules
import { Client, GatewayIntentBits } from 'discord.js';

// Create a Discord client with specified intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// Log in the Discord bot using the provided token
client.login(process.env.DISCORD_TOKEN);

// When the bot is ready
client.on('ready', async () =>
{
    try
    {
        // Get the target guild and channel
        const guild = client.guilds.cache.get("1084629233248260126");
        const channel = guild.channels.cache.get("1129359331805106256");

        // Initialize an object to store unique users by day
        const uniqueUsersByDay = {};

        // Calculate the cutoff date (14 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 14);

        // Initialize a flag to control loop continuation
        let shouldContinue = true;

        // Initialize messages variable for pagination
        let messages;

        // Iterate through paginated message fetching
        let lastMessageId = null;
        do
        {
            // Fetch messages in the channel with pagination
            messages = await channel.messages.fetch({
                limit: 100,
                before: lastMessageId
            });

            // Filter messages sent by the bot and containing "joined"
            const botMessages = messages.filter(message =>
                message.embeds.length > 0 && message.embeds[0].data.author.name.includes("joined")
            );

            // Process each bot message
            for (const message of botMessages.values())
            {
                // Extract username and message creation date
                const username = message.embeds[0].data.author.name.split(" joined the server!")[0];
                const embedDateStr = new Date(message.createdAt).toLocaleDateString();

                // Parse the embedDateStr to a Date object in the format 'dd/mm/yyyy'
                const parts = embedDateStr.split('/');
                const embedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

                // Check if the embedDate is before the cutoff date
                if (embedDate < cutoffDate)
                {
                    // Stop the loop by setting the shouldContinue flag to false
                    shouldContinue = false;
                    break; // Exit the loop immediately
                }

                // Initialize or update the set of unique users for the day
                uniqueUsersByDay[embedDateStr] = uniqueUsersByDay[embedDateStr] || new Set();
                uniqueUsersByDay[embedDateStr].add(username);
            }

            // Update lastMessageId for pagination
            lastMessageId = messages.last()?.id;

        } while (messages.size > 0 && shouldContinue);

        // Calculate the unique user counts and moving average
        const uniqueUserCounts = Object.values(uniqueUsersByDay).map(set => set.size);
        const movingAverage = calculateMovingAverage(uniqueUserCounts);

        // Log the results
        console.log("Unique users joined per day:", uniqueUserCounts);
        console.log("14-day moving average:", movingAverage);

    } catch (error)
    {
        console.error("An error occurred:", error);
    }
});

// Calculate the 14-day moving average
function calculateMovingAverage(values)
{
    if (values.length < 14)
    {
        return null; // Not enough data for a 14-day moving average
    }

    const sum = values.slice(-14).reduce((acc, value) => acc + value, 0);
    return sum / 14;
}
