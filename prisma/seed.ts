import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  DayOfWeek,
  RoomType,
  TimetableEntryType,
} from "../src/generated/prisma/enums";
import { PrismaClient } from "../src/generated/prisma/client";

const runtimeDatabaseUrl = process.env["DATABASE_URL"];

if (!runtimeDatabaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: runtimeDatabaseUrl }),
});

// The official timetable uses both SL and USC for Prof. (Dr.) Swapnil
// Lahudakar. They deliberately map to this single teacher master record.
const teacherMasterRecords = [
  {
    fullName: "Prof. (Dr.) Swapnil Lahudakar",
    employeeCode: null,
  },
  {
    fullName: "Dr. Madhukar Deshmukh",
    employeeCode: "265900563",
  },
  {
    fullName: "Dr. Saba Fatima",
    employeeCode: "245900220",
  },
  {
    fullName: "Mrs. Seema M. Shende",
    employeeCode: "245900257",
  },
  {
    fullName: "Dr. Jayashree Shinde",
    employeeCode: "255900553",
  },
  {
    fullName: "Ms. Tisu Singh",
    employeeCode: "255800537",
  },
  {
    fullName: "Ms. Sonam Pal",
    employeeCode: "255800540",
  },
  {
    fullName: "Dr. Dagma David",
    employeeCode: null,
  },
  {
    fullName: "Dr. Rajendrakumar Anantrao Patil",
    employeeCode: "255900339",
  },
] as const;

type BatchName = "B1" | "B2" | "B3";

type StudentSeedRecord = {
  rollNumber: string;
  prn: string;
  fullName: string;
  batch: BatchName;
};

// Official roll call list for TY BTech B-Div (Faculty of Science and Technology, SECS)
const studentMasterRecords: readonly StudentSeedRecord[] = [
  { rollNumber: "1", prn: "22459020084", fullName: "PATIL KALPESH PRAKASH", batch: "B1" },
  { rollNumber: "2", prn: "22459020085", fullName: "PATIL SAHIL KIRAN", batch: "B1" },
  { rollNumber: "3", prn: "22459020086", fullName: "PATLE RAHEE MOHIT", batch: "B1" },
  { rollNumber: "4", prn: "22459020091", fullName: "PITRUBHAKTA VAISHNAVI ATUL", batch: "B1" },
  { rollNumber: "5", prn: "22459020092", fullName: "PRASAD VINISHA VINOD", batch: "B1" },
  { rollNumber: "6", prn: "22459020093", fullName: "RATHOD RUPESH GOPAL", batch: "B1" },
  { rollNumber: "7", prn: "22459020094", fullName: "RAUT ABHISHEK RAMESH", batch: "B1" },
  { rollNumber: "8", prn: "22459020095", fullName: "RAUT ADITYA VISHWAMBHAR", batch: "B1" },
  { rollNumber: "9", prn: "22459020096", fullName: "RAUT SAKSHI SAINATH", batch: "B1" },
  { rollNumber: "10", prn: "22459020098", fullName: "RODE PRATHAMESH SATISH", batch: "B1" },
  { rollNumber: "11", prn: "22459020099", fullName: "RODE TANISHA LAXMAN", batch: "B1" },
  { rollNumber: "12", prn: "22459020100", fullName: "SABALE KARAN BHASKAR", batch: "B1" },
  { rollNumber: "13", prn: "22459020102", fullName: "SAKORE PRANAV SANDIP", batch: "B1" },
  { rollNumber: "14", prn: "22459020103", fullName: "SACHIN DIGAMBAR SALUNKE", batch: "B1" },
  { rollNumber: "15", prn: "22459020105", fullName: "SANAP HARSHAL GANESH", batch: "B1" },
  { rollNumber: "16", prn: "22459020106", fullName: "SAWANT ATHARV VIJAY", batch: "B1" },
  { rollNumber: "17", prn: "22459020107", fullName: "SHAIKH SHAHAJIT HUSEN", batch: "B1" },
  { rollNumber: "18", prn: "22459020108", fullName: "SHARMA PRATHAMESH DILIP", batch: "B1" },
  { rollNumber: "19", prn: "22459020109", fullName: "SHELAR SURAJ MAHADEV", batch: "B1" },
  { rollNumber: "20", prn: "22459020110", fullName: "SHENDKAR OMKAR RAMESH", batch: "B1" },
  { rollNumber: "21", prn: "22459020111", fullName: "SHINDE ADITYA SANDIP", batch: "B1" },
  { rollNumber: "22", prn: "22459020112", fullName: "SHINDE KANCHAN UTTAM", batch: "B1" },
  { rollNumber: "23", prn: "22459020113", fullName: "SHINDE OMKAR BHAUSAHEB", batch: "B2" },
  { rollNumber: "24", prn: "22459020114", fullName: "SHINDE SHUBHAM PRAVIN", batch: "B2" },
  { rollNumber: "25", prn: "22459020115", fullName: "SHINDE SURAJ CHATRAPATI", batch: "B2" },
  { rollNumber: "26", prn: "22459020116", fullName: "SHINDE SURAJ NAVANATH", batch: "B2" },
  { rollNumber: "27", prn: "22459020117", fullName: "SHIRKE TANMAY PRAKASH", batch: "B2" },
  { rollNumber: "28", prn: "22459020118", fullName: "SHIVALE PRASAD GANPAT", batch: "B2" },
  { rollNumber: "29", prn: "22459020119", fullName: "SOLANKE VIRENDRANATH ASHOKRAO", batch: "B2" },
  { rollNumber: "30", prn: "22459020120", fullName: "SONAWANE AVISHKAR DNYANESHWAR", batch: "B2" },
  { rollNumber: "31", prn: "22459020121", fullName: "SONAWANE DURGESH CHETAN", batch: "B2" },
  { rollNumber: "32", prn: "22459020122", fullName: "SURYAWANSHI VISHAL DINESH", batch: "B2" },
  { rollNumber: "33", prn: "22459020123", fullName: "SUTAR KAUSHAL SUDHIR", batch: "B2" },
  { rollNumber: "34", prn: "22459020124", fullName: "TAKLE KRISHNAI RAJESH", batch: "B2" },
  { rollNumber: "35", prn: "22459020126", fullName: "TELANGE GANESH VAIJANATH", batch: "B2" },
  { rollNumber: "36", prn: "22459020127", fullName: "THANGE ABHIJIT ARUN", batch: "B2" },
  { rollNumber: "37", prn: "22459020129", fullName: "TRIPATHI ARPITA GANESH", batch: "B2" },
  { rollNumber: "38", prn: "22459020130", fullName: "WARUDKAR MAHI SATISH", batch: "B2" },
  { rollNumber: "39", prn: "22459020132", fullName: "KADAM ADITYA VINOD", batch: "B2" },
  { rollNumber: "40", prn: "22459020133", fullName: "DHANKE VIVEK RAMESH", batch: "B2" },
  { rollNumber: "41", prn: "32559022144", fullName: "DHARKAR PRATIK KAILAS", batch: "B2" },
  { rollNumber: "42", prn: "32559022195", fullName: "NAWALE DIYA ANIL", batch: "B2" },
  { rollNumber: "43", prn: "32559023455", fullName: "ADNAK SANIYA BALIRAM", batch: "B2" },
  { rollNumber: "44", prn: "32559023456", fullName: "AHER ADITYA NARAYAN", batch: "B3" },
  { rollNumber: "45", prn: "32559023457", fullName: "ANDHALE SANKET SHASHIKANT", batch: "B3" },
  { rollNumber: "46", prn: "32559023458", fullName: "ASANE SHUBHAM KAKASAHEB", batch: "B3" },
  { rollNumber: "47", prn: "32559023459", fullName: "AUTI SAKSHI JAYSING", batch: "B3" },
  { rollNumber: "48", prn: "32559023460", fullName: "AVISHKAR RAMESH BHOSLE", batch: "B3" },
  { rollNumber: "49", prn: "32559023461", fullName: "BADE DNYANESHWARI SHANKAR", batch: "B3" },
  { rollNumber: "50", prn: "32559023462", fullName: "BADEKAR SAMRUDDHI SATISH", batch: "B3" },
  { rollNumber: "51", prn: "32559023463", fullName: "BAHIRE SHAILESH VACHIST", batch: "B3" },
  { rollNumber: "52", prn: "32559023464", fullName: "BAHULE RAJLAXMI KUNDLIK", batch: "B3" },
  { rollNumber: "53", prn: "32559023465", fullName: "BARAHATE ONKAR SANTOSH", batch: "B3" },
  { rollNumber: "54", prn: "32559023466", fullName: "BARAVKAR VIKRANT VIJAYKUMAR", batch: "B3" },
  { rollNumber: "55", prn: "32559023467", fullName: "BARGE ATHARV PANDURANG", batch: "B3" },
  { rollNumber: "56", prn: "32559023468", fullName: "BEMBDE RUPALI GOVIND", batch: "B3" },
  { rollNumber: "57", prn: "32559023470", fullName: "BHORDE SAKSHI BALASAHEB", batch: "B3" },
  { rollNumber: "58", prn: "32559023471", fullName: "BHOITE SHREYA JAYDIP", batch: "B3" },
  { rollNumber: "59", prn: "32559023472", fullName: "BHOR YASH ARUN", batch: "B3" },
  { rollNumber: "60", prn: "32559023473", fullName: "BIRADAR ANKITA GANGADHAR", batch: "B3" },
  { rollNumber: "61", prn: "32559023474", fullName: "BIRNOLI KUNAL PARASRAM", batch: "B3" },
  { rollNumber: "62", prn: "32559023475", fullName: "BORAKHADE HRUTUJA ARVIND", batch: "B3" },
  { rollNumber: "63", prn: "32559023476", fullName: "CHAUDHARI ADITYA AMOL", batch: "B3" },
] as const;

type SeedCounter = {
  created: number;
  updated: number;
};

// Rooms required by official academic timetable entries
const roomMasterRecords = [
  { building: "KV", roomNumber: "409", type: RoomType.CLASSROOM },
  { building: "KV", roomNumber: "318", type: RoomType.CLASSROOM },
  { building: "KV", roomNumber: "319", type: RoomType.LABORATORY },
  { building: "KV", roomNumber: "402", type: RoomType.LABORATORY },
  { building: "KV", roomNumber: "412", type: RoomType.TUTORIAL_ROOM },
  { building: "KV", roomNumber: "310", type: RoomType.TUTORIAL_ROOM },
  { building: "KV", roomNumber: "420", type: RoomType.LABORATORY },
  {
    building: "FBMC",
    roomNumber: "Kautilya Seminar Hall",
    type: RoomType.AUDITORIUM,
  },
] as const;

type RoomKey =
  | "KV409"
  | "KV318"
  | "KV319"
  | "KV402"
  | "KV412"
  | "KV310"
  | "KV420"
  | "FBMC Kautilya Seminar Hall";

type CourseFacultySeedRecord = {
  courseCode: string;
  teacherFullName: string;
  batch?: BatchName;
};

const courseFacultyMasterRecords: readonly CourseFacultySeedRecord[] = [
  // Division-wide theory courses
  { courseCode: "230GETB97_05", teacherFullName: "Prof. (Dr.) Swapnil Lahudakar" },
  { courseCode: "230GETB16_05", teacherFullName: "Dr. Madhukar Deshmukh" },
  { courseCode: "230GETB17_05", teacherFullName: "Dr. Saba Fatima" },
  { courseCode: "230GETB18_05", teacherFullName: "Mrs. Seema M. Shende" },
  { courseCode: "230GETB113_05", teacherFullName: "Dr. Jayashree Shinde" },
  { courseCode: "230GCSB125_05", teacherFullName: "Ms. Tisu Singh" },
  { courseCode: "230GCSB168_05", teacherFullName: "Ms. Sonam Pal" },
  { courseCode: "231VBCB27_05", teacherFullName: "Dr. Dagma David" },
  { courseCode: "230IINB02_05", teacherFullName: "Dr. Madhukar Deshmukh" },
  { courseCode: "230GETB107_05", teacherFullName: "Dr. Rajendrakumar Anantrao Patil" },
  { courseCode: "231GETB112_05", teacherFullName: "Dr. Jayashree Shinde" },

  // Batch-specific practicals and tutorials
  { courseCode: "230GETB20_05", teacherFullName: "Dr. Madhukar Deshmukh", batch: "B1" },
  { courseCode: "230GETB20_05", teacherFullName: "Dr. Madhukar Deshmukh", batch: "B2" },
  { courseCode: "230GETB20_05", teacherFullName: "Dr. Madhukar Deshmukh", batch: "B3" },

  { courseCode: "230GETB21_05", teacherFullName: "Dr. Saba Fatima", batch: "B1" },
  { courseCode: "230GETB21_05", teacherFullName: "Dr. Saba Fatima", batch: "B2" },
  { courseCode: "230GETB21_05", teacherFullName: "Dr. Saba Fatima", batch: "B3" },

  { courseCode: "230GCSB125_05", teacherFullName: "Ms. Tisu Singh", batch: "B1" },
  { courseCode: "230GCSB125_05", teacherFullName: "Ms. Tisu Singh", batch: "B2" },
  { courseCode: "230GCSB125_05", teacherFullName: "Ms. Tisu Singh", batch: "B3" },

  { courseCode: "230GETB108_05", teacherFullName: "Dr. Rajendrakumar Anantrao Patil", batch: "B1" },
  { courseCode: "230GETB108_05", teacherFullName: "Dr. Rajendrakumar Anantrao Patil", batch: "B2" },

  { courseCode: "230GETB97_05", teacherFullName: "Prof. (Dr.) Swapnil Lahudakar", batch: "B1" },
  { courseCode: "230GETB97_05", teacherFullName: "Prof. (Dr.) Swapnil Lahudakar", batch: "B2" },
  { courseCode: "230GETB97_05", teacherFullName: "Prof. (Dr.) Swapnil Lahudakar", batch: "B3" },
];

type TimetableEntrySeedRecord = {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  courseCode: string;
  teacherFullName: string;
  roomKey: RoomKey;
  entryType: TimetableEntryType;
  batch?: BatchName;
};

// Official academic timetable entries for TY B.Tech E&TC Division B (Semester V)
const timetableMasterRecords: readonly TimetableEntrySeedRecord[] = [
  // MONDAY (8 entries)
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "08:15",
    endTime: "09:15",
    courseCode: "230GETB107_05",
    teacherFullName: "Dr. Rajendrakumar Anantrao Patil",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "09:15",
    endTime: "10:15",
    courseCode: "230GETB107_05",
    teacherFullName: "Dr. Rajendrakumar Anantrao Patil",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "10:30",
    endTime: "11:30",
    courseCode: "230GETB113_05",
    teacherFullName: "Dr. Jayashree Shinde",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "11:30",
    endTime: "12:30",
    courseCode: "230GETB17_05",
    teacherFullName: "Dr. Saba Fatima",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "13:15",
    endTime: "14:15",
    courseCode: "230GETB18_05",
    teacherFullName: "Mrs. Seema M. Shende",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "14:15",
    endTime: "15:15",
    courseCode: "230GETB97_05",
    teacherFullName: "Prof. (Dr.) Swapnil Lahudakar",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "15:30",
    endTime: "16:30",
    courseCode: "230GCSB125_05",
    teacherFullName: "Ms. Tisu Singh",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "16:30",
    endTime: "17:30",
    courseCode: "230GCSB168_05",
    teacherFullName: "Ms. Sonam Pal",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },

  // TUESDAY (6 entries)
  {
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "10:30",
    endTime: "11:30",
    courseCode: "230GETB113_05",
    teacherFullName: "Dr. Jayashree Shinde",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "11:30",
    endTime: "12:30",
    courseCode: "230GETB17_05",
    teacherFullName: "Dr. Saba Fatima",
    roomKey: "KV318",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "13:15",
    endTime: "14:15",
    courseCode: "230GETB18_05",
    teacherFullName: "Mrs. Seema M. Shende",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "14:15",
    endTime: "15:15",
    courseCode: "230GETB16_05",
    teacherFullName: "Dr. Madhukar Deshmukh",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "15:30",
    endTime: "16:30",
    courseCode: "231GETB112_05",
    teacherFullName: "Dr. Jayashree Shinde",
    roomKey: "KV409",
    entryType: TimetableEntryType.NPTEL,
  },
  {
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "16:30",
    endTime: "17:30",
    courseCode: "230GCSB168_05",
    teacherFullName: "Ms. Sonam Pal",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },

  // WEDNESDAY (6 entries)
  {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "08:15",
    endTime: "10:15",
    courseCode: "230GETB108_05",
    teacherFullName: "Dr. Rajendrakumar Anantrao Patil",
    roomKey: "KV420",
    entryType: TimetableEntryType.LAB,
    batch: "B2",
  },
  {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "10:30",
    endTime: "11:30",
    courseCode: "230GETB113_05",
    teacherFullName: "Dr. Jayashree Shinde",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "11:30",
    endTime: "12:30",
    courseCode: "231VBCB27_05",
    teacherFullName: "Dr. Dagma David",
    roomKey: "FBMC Kautilya Seminar Hall",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "13:15",
    endTime: "14:15",
    courseCode: "230GETB97_05",
    teacherFullName: "Prof. (Dr.) Swapnil Lahudakar",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "14:15",
    endTime: "15:15",
    courseCode: "230GETB16_05",
    teacherFullName: "Dr. Madhukar Deshmukh",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "15:30",
    endTime: "16:30",
    courseCode: "230IINB02_05",
    teacherFullName: "Dr. Madhukar Deshmukh",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },

  // THURSDAY (6 entries)
  {
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "08:15",
    endTime: "09:15",
    courseCode: "230GETB107_05",
    teacherFullName: "Dr. Rajendrakumar Anantrao Patil",
    roomKey: "KV409",
    entryType: TimetableEntryType.THEORY,
  },
  {
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "10:30",
    endTime: "12:30",
    courseCode: "230GETB97_05",
    teacherFullName: "Prof. (Dr.) Swapnil Lahudakar",
    roomKey: "KV412",
    entryType: TimetableEntryType.TUTORIAL,
    batch: "B1",
  },
  {
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "10:30",
    endTime: "12:30",
    courseCode: "230GETB97_05",
    teacherFullName: "Prof. (Dr.) Swapnil Lahudakar",
    roomKey: "KV412",
    entryType: TimetableEntryType.TUTORIAL,
    batch: "B2",
  },
  {
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "13:15",
    endTime: "15:15",
    courseCode: "230GETB20_05",
    teacherFullName: "Dr. Madhukar Deshmukh",
    roomKey: "KV420",
    entryType: TimetableEntryType.LAB,
    batch: "B1",
  },
  {
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "13:15",
    endTime: "15:15",
    courseCode: "230GCSB125_05",
    teacherFullName: "Ms. Tisu Singh",
    roomKey: "KV319",
    entryType: TimetableEntryType.LAB,
    batch: "B2",
  },
  {
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "13:15",
    endTime: "15:15",
    courseCode: "230GETB21_05",
    teacherFullName: "Dr. Saba Fatima",
    roomKey: "KV402",
    entryType: TimetableEntryType.LAB,
    batch: "B3",
  },

  // FRIDAY (8 entries)
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "08:15",
    endTime: "10:15",
    courseCode: "230GETB108_05",
    teacherFullName: "Dr. Rajendrakumar Anantrao Patil",
    roomKey: "KV420",
    entryType: TimetableEntryType.LAB,
    batch: "B1",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "10:30",
    endTime: "12:30",
    courseCode: "230GETB21_05",
    teacherFullName: "Dr. Saba Fatima",
    roomKey: "KV402",
    entryType: TimetableEntryType.LAB,
    batch: "B1",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "10:30",
    endTime: "12:30",
    courseCode: "230GETB20_05",
    teacherFullName: "Dr. Madhukar Deshmukh",
    roomKey: "KV420",
    entryType: TimetableEntryType.LAB,
    batch: "B2",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "10:30",
    endTime: "12:30",
    courseCode: "230GCSB125_05",
    teacherFullName: "Ms. Tisu Singh",
    roomKey: "KV319",
    entryType: TimetableEntryType.LAB,
    batch: "B3",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "13:15",
    endTime: "15:15",
    courseCode: "230GCSB125_05",
    teacherFullName: "Ms. Tisu Singh",
    roomKey: "KV319",
    entryType: TimetableEntryType.LAB,
    batch: "B1",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "13:15",
    endTime: "15:15",
    courseCode: "230GETB21_05",
    teacherFullName: "Dr. Saba Fatima",
    roomKey: "KV402",
    entryType: TimetableEntryType.LAB,
    batch: "B2",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "13:15",
    endTime: "15:15",
    courseCode: "230GETB20_05",
    teacherFullName: "Dr. Madhukar Deshmukh",
    roomKey: "KV420",
    entryType: TimetableEntryType.LAB,
    batch: "B3",
  },
  {
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "15:30",
    endTime: "17:30",
    courseCode: "230GETB97_05",
    teacherFullName: "Prof. (Dr.) Swapnil Lahudakar",
    roomKey: "KV310",
    entryType: TimetableEntryType.TUTORIAL,
    batch: "B3",
  },
];

function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

function validateRosterSource() {
  if (studentMasterRecords.length !== 63) {
    throw new Error(
      `Expected 63 students in roster, found ${studentMasterRecords.length}.`,
    );
  }

  const b1Count = studentMasterRecords.filter((s) => s.batch === "B1").length;
  const b2Count = studentMasterRecords.filter((s) => s.batch === "B2").length;
  const b3Count = studentMasterRecords.filter((s) => s.batch === "B3").length;

  if (b1Count !== 22 || b2Count !== 21 || b3Count !== 20) {
    throw new Error(
      `Invalid batch distribution: B1=${b1Count} (expected 22), B2=${b2Count} (expected 21), B3=${b3Count} (expected 20).`,
    );
  }

  const prnSet = new Set<string>();
  const rollSet = new Set<string>();

  for (const student of studentMasterRecords) {
    if (prnSet.has(student.prn)) {
      throw new Error(`Duplicate PRN in source roster: ${student.prn}`);
    }
    prnSet.add(student.prn);

    if (rollSet.has(student.rollNumber)) {
      throw new Error(
        `Duplicate roll number in source roster: ${student.rollNumber}`,
      );
    }
    rollSet.add(student.rollNumber);
  }
}

async function assertAttendxDatabase() {
  const result = await prisma.$queryRaw<Array<{ database: string }>>`
    SELECT current_database() AS database
  `;

  if (result[0]?.database !== "attendx") {
    throw new Error("Seed target database is not the configured AttendX database.");
  }
}

async function main() {
  validateRosterSource();
  await assertAttendxDatabase();

  const summary = await prisma.$transaction(
    async (tx) => {
      const department = await tx.department.findUniqueOrThrow({
        where: { code: "ENTC" },
      });
      const program = await tx.program.findUniqueOrThrow({
        where: {
          departmentId_code: {
            departmentId: department.id,
            code: "BTECH",
          },
        },
      });
      const academicYear = await tx.academicYear.findUniqueOrThrow({
        where: { name: "2026-27" },
      });
      const semester = await tx.semester.findUniqueOrThrow({
        where: {
          academicYearId_programId_number: {
            academicYearId: academicYear.id,
            programId: program.id,
            number: 5,
          },
        },
      });
      const classRecord = await tx.class.findUniqueOrThrow({
        where: {
          programId_semesterId_name: {
            programId: program.id,
            semesterId: semester.id,
            name: "TY B.Tech E&TC",
          },
        },
      });
      const division = await tx.division.findUniqueOrThrow({
        where: {
          classId_name: {
            classId: classRecord.id,
            name: "B",
          },
        },
      });
      const pecGroup = await tx.courseGroup.findUniqueOrThrow({
        where: {
          semesterId_name: {
            semesterId: semester.id,
            name: "PEC",
          },
        },
      });

      const batches = await tx.batch.findMany({
        where: {
          divisionId: division.id,
          name: { in: ["B1", "B2", "B3"] },
        },
      });

      if (batches.length !== 3) {
        throw new Error("Batches B1, B2, and B3 must all exist under Division B.");
      }

      const batchMap = new Map<string, string>();
      for (const b of batches) {
        batchMap.set(b.name, b.id);
      }

      const b1BatchId = batchMap.get("B1");
      const b2BatchId = batchMap.get("B2");
      const b3BatchId = batchMap.get("B3");

      if (!b1BatchId || !b2BatchId || !b3BatchId) {
        throw new Error("Missing batch mappings for B1, B2, or B3.");
      }

      const [courses, courseGroupCourseCount, userCount] = await Promise.all([
        tx.course.findMany({ where: { departmentId: department.id } }),
        tx.courseGroupCourse.count({ where: { courseGroupId: pecGroup.id } }),
        tx.user.count(),
      ]);

      if (courses.length !== 15 || courseGroupCourseCount !== 2) {
        throw new Error("AttendX academic and course master prerequisites are incomplete.");
      }

      if (userCount !== 0) {
        throw new Error(`Preflight check failed: expected 0 Users, found ${userCount}.`);
      }

      const courseMapByCode = new Map(courses.map((c) => [c.code, c.id]));

      // 1. Teachers Seed
      const teachers: SeedCounter = { created: 0, updated: 0 };
      const teacherMapByName = new Map<string, string>();

      for (const teacherData of teacherMasterRecords) {
        const matchingTeachers = await tx.teacher.findMany({
          where: {
            departmentId: department.id,
            fullName: teacherData.fullName,
          },
          select: { id: true },
        });

        if (matchingTeachers.length > 1) {
          throw new Error(
            `Teacher seed identity is ambiguous for ${teacherData.fullName}.`,
          );
        }

        const existingTeacher = matchingTeachers[0];

        if (teacherData.employeeCode) {
          const teacherWithEmployeeCode = await tx.teacher.findUnique({
            where: { employeeCode: teacherData.employeeCode },
            select: { id: true },
          });

          if (
            teacherWithEmployeeCode &&
            teacherWithEmployeeCode.id !== existingTeacher?.id
          ) {
            throw new Error(
              `Employee code conflict for ${teacherData.fullName}; no records were changed.`,
            );
          }
        }

        if (existingTeacher) {
          await tx.teacher.update({
            where: { id: existingTeacher.id },
            data: {
              fullName: teacherData.fullName,
              employeeCode: teacherData.employeeCode,
              departmentId: department.id,
            },
          });
          teacherMapByName.set(teacherData.fullName, existingTeacher.id);
          teachers.updated += 1;
        } else {
          const newTeacher = await tx.teacher.create({
            data: {
              fullName: teacherData.fullName,
              employeeCode: teacherData.employeeCode,
              departmentId: department.id,
            },
          });
          teacherMapByName.set(teacherData.fullName, newTeacher.id);
          teachers.created += 1;
        }
      }

      // 2. Students Seed
      const students: SeedCounter = { created: 0, updated: 0 };
      const existingStudents = await tx.student.findMany({
        where: { divisionId: division.id },
        select: { id: true, prn: true, rollNumber: true, userId: true },
      });

      const existingStudentsByPrn = new Map(
        existingStudents.map((s) => [s.prn, s]),
      );
      const existingStudentsByRoll = new Map(
        existingStudents.map((s) => [s.rollNumber, s]),
      );

      for (const studentData of studentMasterRecords) {
        const batchId = batchMap.get(studentData.batch);
        if (!batchId) {
          throw new Error(
            `Unknown batch ${studentData.batch} for student ${studentData.fullName}.`,
          );
        }

        const existingRollStudent = existingStudentsByRoll.get(studentData.rollNumber);
        if (existingRollStudent && existingRollStudent.prn !== studentData.prn) {
          throw new Error(
            `Roll number conflict: roll ${studentData.rollNumber} in Division B is already assigned to PRN ${existingRollStudent.prn}.`,
          );
        }

        const existingStudent = existingStudentsByPrn.get(studentData.prn);

        if (existingStudent) {
          await tx.student.update({
            where: { id: existingStudent.id },
            data: {
              rollNumber: studentData.rollNumber,
              fullName: studentData.fullName,
              divisionId: division.id,
              batchId: batchId,
            },
          });
          students.updated += 1;
        } else {
          await tx.student.create({
            data: {
              prn: studentData.prn,
              rollNumber: studentData.rollNumber,
              fullName: studentData.fullName,
              divisionId: division.id,
              batchId: batchId,
              userId: null,
            },
          });
          students.created += 1;
        }
      }

      // 3. Rooms Seed
      const rooms: SeedCounter = { created: 0, updated: 0 };
      const roomMap = new Map<string, string>();

      for (const roomData of roomMasterRecords) {
        const existingRoom = await tx.room.findUnique({
          where: {
            building_roomNumber: {
              building: roomData.building,
              roomNumber: roomData.roomNumber,
            },
          },
        });

        const key =
          roomData.building === "KV"
            ? `KV${roomData.roomNumber}`
            : `${roomData.building} ${roomData.roomNumber}`;

        if (existingRoom) {
          await tx.room.update({
            where: { id: existingRoom.id },
            data: { type: roomData.type },
          });
          roomMap.set(key, existingRoom.id);
          rooms.updated += 1;
        } else {
          const createdRoom = await tx.room.create({
            data: {
              building: roomData.building,
              roomNumber: roomData.roomNumber,
              type: roomData.type,
            },
          });
          roomMap.set(key, createdRoom.id);
          rooms.created += 1;
        }
      }

      // 4. CourseFaculty Seed
      const courseFaculty: SeedCounter = { created: 0, updated: 0 };

      for (const cfData of courseFacultyMasterRecords) {
        const courseId = courseMapByCode.get(cfData.courseCode);
        if (!courseId) {
          throw new Error(`Course code ${cfData.courseCode} not found in database.`);
        }
        const teacherId = teacherMapByName.get(cfData.teacherFullName);
        if (!teacherId) {
          throw new Error(`Teacher ${cfData.teacherFullName} not found in database.`);
        }

        const batchId = cfData.batch ? batchMap.get(cfData.batch) ?? null : null;
        const scopeKey = batchId ?? "DIVISION";

        const existingCF = await tx.courseFaculty.findUnique({
          where: {
            courseId_teacherId_semesterId_divisionId_scopeKey: {
              courseId,
              teacherId,
              semesterId: semester.id,
              divisionId: division.id,
              scopeKey,
            },
          },
        });

        if (existingCF) {
          await tx.courseFaculty.update({
            where: { id: existingCF.id },
            data: { batchId },
          });
          courseFaculty.updated += 1;
        } else {
          await tx.courseFaculty.create({
            data: {
              courseId,
              teacherId,
              semesterId: semester.id,
              divisionId: division.id,
              batchId,
              scopeKey,
            },
          });
          courseFaculty.created += 1;
        }
      }

      // 5. TimetableEntry Seed
      const timetableEntries: SeedCounter = { created: 0, updated: 0 };
      const existingEntries = await tx.timetableEntry.findMany({
        where: {
          semesterId: semester.id,
          divisionId: division.id,
        },
      });

      for (const tData of timetableMasterRecords) {
        const courseId = courseMapByCode.get(tData.courseCode);
        if (!courseId) {
          throw new Error(`Course code ${tData.courseCode} not found in database.`);
        }
        const teacherId = teacherMapByName.get(tData.teacherFullName);
        if (!teacherId) {
          throw new Error(`Teacher ${tData.teacherFullName} not found in database.`);
        }
        const roomId = roomMap.get(tData.roomKey);
        if (!roomId) {
          throw new Error(`Room key ${tData.roomKey} not found in room map.`);
        }
        const batchId = tData.batch ? batchMap.get(tData.batch) ?? null : null;

        const start = parseTimeString(tData.startTime);
        const end = parseTimeString(tData.endTime);

        const existingEntry = existingEntries.find(
          (e) =>
            e.dayOfWeek === tData.dayOfWeek &&
            e.startTime.getUTCHours() === start.getUTCHours() &&
            e.startTime.getUTCMinutes() === start.getUTCMinutes() &&
            e.endTime.getUTCHours() === end.getUTCHours() &&
            e.endTime.getUTCMinutes() === end.getUTCMinutes() &&
            e.courseId === courseId &&
            e.teacherId === teacherId &&
            e.roomId === roomId &&
            (e.batchId ?? null) === (batchId ?? null),
        );

        if (existingEntry) {
          await tx.timetableEntry.update({
            where: { id: existingEntry.id },
            data: {
              entryType: tData.entryType,
              isActive: true,
            },
          });
          timetableEntries.updated += 1;
        } else {
          await tx.timetableEntry.create({
            data: {
              semesterId: semester.id,
              divisionId: division.id,
              courseId,
              teacherId,
              roomId,
              batchId,
              dayOfWeek: tData.dayOfWeek,
              startTime: start,
              endTime: end,
              entryType: tData.entryType,
              isActive: true,
            },
          });
          timetableEntries.created += 1;
        }
      }

      return {
        teachers,
        students,
        rooms,
        courseFaculty,
        timetableEntries,
      };
    },
    {
      maxWait: 15000,
      timeout: 60000,
    },
  );

  console.log(
    `Seed complete:
- Teachers: ${summary.teachers.created} created, ${summary.teachers.updated} updated
- Students: ${summary.students.created} created, ${summary.students.updated} updated
- Rooms: ${summary.rooms.created} created, ${summary.rooms.updated} updated
- CourseFaculty: ${summary.courseFaculty.created} created, ${summary.courseFaculty.updated} updated
- TimetableEntries: ${summary.timetableEntries.created} created, ${summary.timetableEntries.updated} updated`,
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown seed error.";
    console.error(`Seed failed: ${message.replaceAll(runtimeDatabaseUrl, "[redacted]")}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
