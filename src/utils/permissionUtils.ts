import { Interaction, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ConfigManager } from './configManager.js';

/**
 * Checks if a user has permission to perform DJ actions.
 * - If no DJ role is configured for the guild, returns TRUE (everyone can control).
 * - If DJ role is configured, returns TRUE only if user has the role or is Admin.
 */
export const checkDJPermission = (interaction: Interaction): boolean => {
    if (!interaction.guild) return false;

    const member = interaction.member as GuildMember;
    if (!member) return false;

    // 1. Check for Administrator (always allow)
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

    // 2. Get DJ Role ID
    const djRoleId = ConfigManager.getDJRole(interaction.guild.id);

    // 3. If NO DJ role is set, allow everyone (Optional DJ Setup)
    if (!djRoleId) return true;

    // 4. Check if user has the specific role
    if (member.roles.cache.has(djRoleId)) return true;

    return false;
};
