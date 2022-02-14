const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Mentor = require("../models/Mentor");
const Student = require("../models/Student");
const dotenv = require("dotenv");

// importing utils
const response = require("../utils/responses.utils");

// importing helpers methods
const studentHelpers = require("../helpers/student.helper");
const mentorHelpers = require("../helpers/mentor.helper");

// env config
dotenv.config();

/**
 * This module consists of all the handler function for the admin route
 */

module.exports = {
    // admin login handler fn
    adminLoginHandler: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                // if email/pass does not exists
                return response.badrequest(res, "Please provide valid email/password", {});
            }

            const admin = await Admin.findByCredentials(email, password);
            const token = await admin.generateAuthToken();
            response.success(res, "Login successful", { auth_token: token, role: "ADMIN" });

            req.user = admin;
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // admin dashboard handler function
    adminDashboardHandler: (req, res, next) => {
        response.success(res, "", { user: req.user });
        next();
    },

    // this route handler returns the list of all users i.e, all mentors and students
    getAllUsers: async (req, res, next) => {
        const students = await studentHelpers.getAllStudents();
        const mentors = await mentorHelpers.getAllMentors();
        response.success(res, "", { mentors, students });
        next();
    },

    /**
     *  saveGroup route saves the mentor and students group.
     *  We store the mentor's id in every student's property named "mentordBy" , to establish a link
     *  between a mentor and the students mentored by him.
     *
     * Add/Update and unassigned students operations are in this route
     * */
    saveGroup: async (req, res, next) => {
        try {
            const mentorCountToUpdate = {};
            const newStudentsList = {};
            const mentor = await Mentor.findById(req.body.mentorId);
            const students = req.body.studentIds;
            const oldStudents = await Student.find({
                mentoredBy: mongoose.Types.ObjectId(req.body.mentorId),
            }).distinct("_id");

            if (!mentor) {
                // if mentor doesn't exists
                return response.error(res);
            }

            // generating the newStudentList object or hash map
            for (let i = 0; i < students.length; i++) {
                if (!newStudentsList[students[i]]) {
                    newStudentsList[students[i]] = 1;
                }
            }

            // finding the students not in the old instance from db
            for (let i = 0; i < oldStudents.length; i++) {
                if (!newStudentsList[oldStudents[i]]) {
                    const oldStudent = await Student.findById(oldStudents[i]);
                    oldStudent.mentoredBy = undefined;
                    oldStudent.assigned = "";
                    await oldStudent.save();
                }
            }

            // looping through students array
            for (i = 0; i < students.length; i++) {
                const student = await Student.findById(students[i]);
                // checking for changes in the new request. And updating the student count
                if (student.mentoredBy && student.mentoredBy !== req.body.mentorId) {
                    mentorCountToUpdate[student.mentoredBy]
                        ? (mentorCountToUpdate[student.mentoredBy] += 1)
                        : (mentorCountToUpdate[student.mentoredBy] = 1);
                }
                student.mentoredBy = mentor._id;
                // setting student to assigned
                student.assigned = "in a group";
                await student.save();
            }

            if (Object.keys(mentorCountToUpdate).length !== 0) {
                for (let mentorId in mentorCountToUpdate) {
                    const newMentor = await Mentor.findById(mentorId);
                    newMentor.studentCount -= mentorCountToUpdate[mentorId];
                    if (newMentor.studentCount < 1) {
                        newMentor.assigned = "unassigned"; // "" empty string is used to set false
                    }
                    await newMentor.save();
                }
            }

            // setting mentor to assigned
            if (students.length === 0) {
                mentor.assigned = "unassigned";
            } else {
                mentor.assigned = "assigned";
            }
            // setting no of students
            mentor.studentCount = students.length;
            await mentor.save();

            // getting all the students and mentors after performing all the above operations
            const allStudents = await studentHelpers.getAllStudents();
            const allMentors = await mentorHelpers.getAllMentors();

            // log.generateLog(logEvents.GROUP_UPDATE, req.user, req.ip); // logging the event

            // sending final response back
            response.success(res, "Assigned Successfully", {
                mentors: allMentors,
                students: allStudents,
            });
            next();
        } catch (err) {
            console.log("catch", err);
            response.error(res);
        }
    },
    getAllLogs: async (req, res, next) => {
        try {
            const allLogs = await Log.find();
            response.success(res, "", { logs: allLogs });
            next();
        } catch (err) {
            console.log(err);
        }
    },
};
