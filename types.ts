
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

export interface BaseUpload {
  id: string;
  title: string;
  category: string;
  branch: string[]; // ['Comp', 'IT', etc]
  year: string[];   // ['1st Year', etc]
  fileUrl?: string; // Base64 or URL
  content?: string;
  summary?: string;
  tags?: string[];
  aiProcessed: boolean;
  uploadedAt: any;
  uploadedBy: string;
}

export interface TimetableEntry extends BaseUpload {
  day: string;
  division: string;
  slots: {
    id: string;
    time: string;
    subject: string;
    room: string;
    color: string;
  }[];
}

export interface ExamNotice extends BaseUpload {
  subject?: string;
  date?: string;
  time?: string;
  venue?: string;
  division?: string;
}

export interface ScholarshipItem extends BaseUpload {
  amount?: string;
  deadline?: string;
  eligibility?: string;
  name?: string;
  sourceType?: string;
  applicationLink?: string;
}

export interface InternshipItem extends BaseUpload {
  company?: string;
  role?: string;
  location?: string;
  stipend?: string;
}

export interface Announcement extends BaseUpload {
  priority: 'HIGH' | 'NORMAL';
}

export interface AttendanceRecord {
  id: string;
  subject: string;
  percentage: number;
  totalClasses: number;
  attendedClasses: number;
  branch: string;
  year: string;
}

export interface Complaint {
  id: string;
  text: string;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface AppData {
  attendance: AttendanceRecord[];
  timetable: TimetableEntry[];
  exams: ExamNotice[];
  scholarships: ScholarshipItem[];
  internships: InternshipItem[];
  broadcasts: Announcement[];
  events: any[]; 
  complaints: Complaint[];
  rawKnowledge: string[];
  campusMapImage?: string;
}
