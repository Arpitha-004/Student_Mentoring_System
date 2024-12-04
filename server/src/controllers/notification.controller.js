const Notification = require("../models/Notification");
const Parent = require("../models/parent");
const Student = require("../models/Student"); // Import Student model
const response = require("../utils/responses.utils");
const roles = require("../utils/roles");
const mongoose = require("mongoose");

module.exports = {
    /**
     * createNotification: Creates new notification when an event is triggered
     * @Desc This method creates a new notification and saves it to db.
     * @param {*} event Triggered event type
     * @param {*} content Notification data
     * @param {*} creator User who created the notification
     * @param {*} receivers Users who will receive notifications
     */
    createNotification: async (event, content, creator, receivers) => {
        console.log("Post Notification triggered..");
        try {
            const newNotify = new Notification({
                event: event,
                creator: creator._id,
                creatorModel: creator.role,
                content: content._id,
                contentModel: event.model,
            });

            newNotify.receivers = receivers.map((receiver) => {
                return {
                    role: receiver.role,
                    user: receiver._id,
                    read: false,
                };
            });

            // Add parents as receivers if their notificationsEnabled is true and they are related to the student
            const parentReceivers = await Parent.find({
                notificationsEnabled: true,
            });

            newNotify.receivers = [
                ...newNotify.receivers,
                ...parentReceivers.map((parent) => {
                    return {
                        role: "parent",
                        user: parent._id,
                        read: false,
                    };
                }),
            ];

            await newNotify.save();
        } catch (err) {
            console.log(err);
        }
    },

    /**
     * notifyParent: Sends notification to parents if a student has more than 10 unread notifications
     * @Desc This function checks if a student has more than 10 unread notifications and notifies their parents.
     * @param {String} studentId The ID of the student
     */
    notifyParent: async (studentId) => {
        try {
            // Fetch the student by ID
            const student = await Student.findById(studentId);

            // If the student is not found, exit
            if (!student) {
                console.log(`Student not found: ${studentId}`);
                return;
            }

            // Fetch parents of the student by matching studentId in the `children` array of parents
            const parents = await Parent.find({
                children: studentId,  // The parent has the student in their `children` list
                notificationsEnabled: true,  // Check if notifications are enabled
            });

            // If no parents are found or notifications are disabled, return
            if (!parents || parents.length === 0) {
                console.log(`No parents found for student: ${studentId} or parents have notifications disabled.`);
                return;
            }

            // Check if the student has more than 10 unread notifications
            const unreadNotifications = await Notification.find({
                "receivers.user": studentId,
                "receivers.read": false,
            }).countDocuments();

            if (unreadNotifications > 10) {
                // Notify parents about the unread notifications
                for (const parent of parents) {
                    const notification = new Notification({
                        event: "Unread Notifications Alert",
                        content: `Your student has ${unreadNotifications} unread notifications.`,
                        receivers: [{ role: "parent", user: parent._id, read: false }],
                    });
                    await notification.save();
                }

                console.log(`Notification sent to parents of student: ${studentId}`);
            }
        } catch (err) {
            console.error("Error notifying parent:", err);
        }
    },

    /**
     * sendNotificationToParents: Sends a notification to specific parents of a student
     * @Desc This method sends a notification to specific parents based on the student's ID.
     * @param {String} studentId The ID of the student
     * @param {String} message The notification message
     */
    sendNotificationToParents: async (studentId, message) => {
        try {
            // Find the student by ID and populate the parents field
            const student = await Student.findById(studentId).populate("parents");

            if (!student) {
                throw new Error("Student not found");
            }

            // Loop through the parents and send notification
            for (const parent of student.parents) {
                if (parent.notificationsEnabled) {  // Check if the parent has notifications enabled
                    const newNotification = new Notification({
                        event: "Student Update",
                        content: message, // The message to send
                        receivers: [
                            {
                                role: "parent",
                                user: parent._id,
                                read: false,
                            },
                        ],
                    });
                    await newNotification.save();
                }
            }

            console.log(`Notification sent to parents of student: ${studentId}`);
        } catch (err) {
            console.error("Error sending notification:", err);
        }
    },

    // Fetch all notifications
    getAllNotifications: async (req, res, next) => {
        try {
            const notifications = await Notification.find({
                $and: [
                    { "receivers.user": req.user._id },
                    { "receivers.willReceive": { $ne: false } },
                ],
            }).populate(["creator", "content", "receivers.user"]);

            response.success(res, "", notifications);
        } catch (err) {
            console.log(err);
        }
    },

    // Fetch notification by ID
    getNotificationById: async (req, res, next) => {
        try {
            const notification = await Notification.findById(req.params.id);
            response.success(res, "", notification);
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // Set notifications as read
    setNotificationAsRead: async (req, res, next) => {
        try {
            const notifications = req.body;

            const readNotifications = [];

            for (let i = 0; i < notifications.length; i++) {
                const item = notifications[i];
                const doc = await Notification.findOneAndUpdate(
                    { _id: item.id, "receivers.user": req.user._id },
                    {
                        $set: {
                            "receivers.$.read": true,
                            "receivers.$.willReceive": item.willReceive,
                        },
                    },
                    { new: true }
                );

                // Generate response
                readNotifications.push(
                    await new Notification(doc).execPopulate(["creator", "content", "receivers.user"])
                );
            }

            response.success(res, "", { read: readNotifications });
        } catch (err) {
            console.log(err);
        }
    },
};
