import openpyxl
import random

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Students"

headers = ["Name", "Register Number", "Email", "Password", "Department"]
ws.append(headers)

departments = ["CSE", "ECE", "MECH", "CIVIL", "EEE", "IT", "AI&DS"]

for i in range(1, 2501):
    name = f"Student {i}"
    reg_no = f"REG{10000 + i}"
    email = f"student{i}@example.com"
    password = "password123"
    dept = random.choice(departments)
    
    ws.append([name, reg_no, email, password, dept])

file_path = r"c:\Users\saura\OneDrive\Desktop\SRCP_Project\student_payload.xlsx"
wb.save(file_path)
print(f"Successfully generated {file_path} with 2500 records.")
