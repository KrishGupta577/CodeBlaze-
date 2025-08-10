import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createRoom = mutation({
    args: {
        roomId: v.string(),
        userId: v.string(),
        name: v.string(),
    },
    handler: async ({ db }, args) => {

        const existingRoom = await db
            .query("rooms")
            .filter((q) => q.eq(q.field("roomId"), args.roomId))
            .first();

        if (!existingRoom) {
            await db.insert("rooms", {
                roomId: args.roomId,
                host: {
                    userId: args.userId,
                    name: args.name,
                },
                isLive: true,
                createdAt: Date.now(),
            });
        }

        return { message: "Room created successfully." };
    },
})

export const addParticipant = mutation({
    args: {
        roomId: v.string(),
        participantId: v.string(),
        name: v.string(),
    },
    handler: async ({ db }, args) => {
        // Step 1: Find the room by roomId (via index)
        const room = await db
            .query("rooms")
            .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
            .unique();

        if (!room) {
            throw new Error("Room not found.");
        }

        // Step 2: Check if participant already exists
        const alreadyJoined = room.participants?.some(
            (p) => p.userId === args.participantId
        );

        if (alreadyJoined) {
            return { message: "User is already a participant." };
        }

        // Step 3: Add new participant
        const updatedParticipants = [
            ...(room.participants ?? []),
            {
                userId: args.participantId,
                name: args.name,
                joinedAt: Date.now(),
                role: "viewer",
                status: "connected",
            },
        ];

        await db.patch(room._id, {
            participants: updatedParticipants,
        });

        return { message: "Room Joined Successfully." };
    },
});

export const getRoom = query({
    args: {
        roomId: v.string(),
    },
    handler: async (ctx, args) => {
        const { roomId } = args;

        const room = await ctx.db
            .query('rooms')
            .withIndex('by_room_id', (q) => q.eq('roomId', roomId))
            .first();

        if (!room) {
            return null; // Room not found
        }

        // Fixed: Don't return empty object, return undefined/null if host is missing
        if (!room.host || !room.host.userId || !room.host.name) {
            return null; // Return null if host data is incomplete
        }

        return {
            roomId: room.roomId,
            host: room.host, // Now this will always have the proper structure
            participants: room.participants || [],
            code: room.code,
            isLive: room.isLive,
            createdAt: room.createdAt,
        };
    },
});

export const deleteParticipant = mutation({
    args: {
        roomId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const room = await ctx.db
            .query("rooms")
            .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
            .unique();

        if (!room) {
            throw new Error("Room not found");
        }

        const updatedParticipants = (room.participants || []).filter(
            (participant) => participant.userId !== args.userId
        );

        await ctx.db.patch(room._id, {
            participants: updatedParticipants,
        });
    },
});