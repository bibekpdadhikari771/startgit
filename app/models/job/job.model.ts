import mongoose, { Schema, Document } from "mongoose";

interface Job extends Document {
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    type: 'full-time' | 'part-time' | 'internship';
    deadline?: Date;
    salary?: string;
    requirements: string[];
    employerId: string;
    createdAt: string;
    updatedAt: string;
}


const JobSchema: Schema<Job> = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    company: {
        type: String,
        required: [true, 'Company is required'],
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
    },
    type: {
        type: String,
        enum: ['full-time', 'part-time', 'internship'],
        required: [true, 'Type is required'],
    },
    deadline: {
        type: Date,
        required: false,
    },
    salary: {
        type: String,
        required: false,
    },
    requirements: {
        type: [String],
        required: true,
    },
    employerId: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const JobModel = mongoose.models.Job || mongoose.model<Job>('Job', JobSchema);

export default JobModel;