
export type ModuleType = 
  | 'DASHBOARD'
  | 'VPAI' 
  | 'ATTENDANCE' 
  | 'TIMETABLE' 
  | 'SCHOLARSHIP' 
  | 'EVENT_INFO' 
  | 'EXAM_INFO' 
  | 'COMPLAINT_BOX' 
  | 'INTERNSHIP' 
  | 'CAMPUS_MAP';

export interface AttendanceRecord {
  id: string;
  subject: string;
  percentage: number;
  totalClasses: number;
  attendedClasses: number;
  branch: string;
  year: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  branch: string;
  year: string;
  division: string;
  slots: {
    id: string;
    time: string;
    subject: string;
    room: string;
    color: string;
  }[];
}

export interface ExamSchedule {
  id: string;
  subject: string;
  date: string;
  time: string;
  venue: string;
  branch: string;
  year: string;
  division: string;
}

export interface ScholarshipItem {
  id: string;
  name: string;
  amount: string;
  deadline: string;
  eligibility: string;
  category: 'GIRLS' | 'GENERAL';
  branch?: string;
  year?: string;
}

export interface InternshipItem {
  id: string;
  company: string;
  role: string;
  location: string;
  stipend: string;
  branch: string;
  year: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  category: 'Comp' | 'IT' | 'Civil' | 'Mech' | 'Elect' | 'AIDS' | 'E&TC' | 'General';
  imageUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  priority: 'HIGH' | 'NORMAL';
}

export interface Complaint {
  id: string;
  text: string;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface UploadLog {
  id: string;
  fileName: string;
  type: string;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface AppData {
  attendance: AttendanceRecord[];
  timetable: TimetableEntry[];
  exams: ExamSchedule[];
  scholarships: ScholarshipItem[];
  internships: InternshipItem[];
  events: CampusEvent[];
  announcements: Announcement[];
  complaints: Complaint[];
  rawKnowledge: string[];
  campusMapImage?: string;
  uploadLogs: UploadLog[];
}
