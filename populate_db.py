import csv
import io

hardcoded_colleges = [
    ["Indian Institute of Technology Bombay", "Mumbai", "Maharashtra"],
    ["Indian Institute of Technology Delhi", "New Delhi", "Delhi"],
    ["Indian Institute of Technology Madras", "Chennai", "Tamil Nadu"],
    ["Indian Institute of Technology Kanpur", "Kanpur", "Uttar Pradesh"],
    ["Indian Institute of Technology Kharagpur", "Kharagpur", "West Bengal"],
    ["Indian Institute of Technology Roorkee", "Roorkee", "Uttarakhand"],
    ["Indian Institute of Technology Guwahati", "Guwahati", "Assam"],
    ["Indian Institute of Technology Hyderabad", "Hyderabad", "Telangana"],
    ["BITS Pilani", "Pilani", "Rajasthan"],
    ["Vellore Institute of Technology", "Vellore", "Tamil Nadu"],
    ["National Institute of Technology Trichy", "Tiruchirappalli", "Tamil Nadu"],
    ["National Institute of Technology Surathkal", "Mangalore", "Karnataka"],
    ["National Institute of Technology Warangal", "Warangal", "Telangana"],
    ["Delhi Technological University", "New Delhi", "Delhi"],
    ["Netaji Subhas University of Technology", "New Delhi", "Delhi"],
    ["RV College of Engineering", "Bengaluru", "Karnataka"],
    ["PES University", "Bengaluru", "Karnataka"],
    ["BMS College of Engineering", "Bengaluru", "Karnataka"],
    ["Manipal Institute of Technology", "Manipal", "Karnataka"],
    ["SRM Institute of Science and Technology", "Chennai", "Tamil Nadu"],
    ["Birla Institute of Technology Mesra", "Ranchi", "Jharkhand"],
    ["Indian Institute of Science", "Bengaluru", "Karnataka"],
    ["Anna University", "Chennai", "Tamil Nadu"],
    ["Jadavpur University", "Kolkata", "West Bengal"],
    ["College of Engineering Pune", "Pune", "Maharashtra"],
    ["Veermata Jijabai Technological Institute", "Mumbai", "Maharashtra"],
    ["Thapar Institute of Engineering and Technology", "Patiala", "Punjab"],
    ["Amrita Vishwa Vidyapeetham", "Coimbatore", "Tamil Nadu"],
    ["Indian Institute of Information Technology Hyderabad", "Hyderabad", "Telangana"],
    ["Christ University", "Bengaluru", "Karnataka"],
    ["Delhi University", "New Delhi", "Delhi"],
    ["Jawaharlal Nehru University", "New Delhi", "Delhi"],
    ["Banaras Hindu University", "Varanasi", "Uttar Pradesh"],
    ["Symbiosis International University", "Pune", "Maharashtra"],
    ["Amity University", "Noida", "Uttar Pradesh"],
    ["Lovely Professional University", "Phagwara", "Punjab"],
    ["All India Institute of Medical Sciences Delhi", "New Delhi", "Delhi"],
    ["Christian Medical College", "Vellore", "Tamil Nadu"],
    ["Armed Forces Medical College", "Pune", "Maharashtra"],
    ["St. Stephen's College", "New Delhi", "Delhi"],
    ["Lady Shri Ram College", "New Delhi", "Delhi"],
    ["Loyola College", "Chennai", "Tamil Nadu"],
    ["Shri Ram College of Commerce", "New Delhi", "Delhi"],
    ["Hindu College", "New Delhi", "Delhi"],
    ["Indian Statistical Institute", "Kolkata", "West Bengal"],
    ["Indian Institute of Management Ahmedabad", "Ahmedabad", "Gujarat"],
    ["Indian Institute of Management Bangalore", "Bengaluru", "Karnataka"],
    ["Indian Institute of Management Calcutta", "Kolkata", "West Bengal"],
    ["National Law School of India University", "Bengaluru", "Karnataka"],
    ["Other / Not Listed", "", ""]
]

seen_names = set()
values = []

def escape_sql(s):
    if not s:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

for c in hardcoded_colleges:
    name = c[0].strip()
    if len(name) > 255: name = name[:255]
    if name.lower() not in seen_names:
        seen_names.add(name.lower())
        values.append(f"({escape_sql(name)}, {escape_sql(c[1])}, {escape_sql(c[2])})")

csv_path = '/Users/saranshsuman/Desktop/ComingSoon/asksenior-backend/asksenior/src/main/resources/colleges.csv'
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('name', '').strip()
        city = row.get('city', '').strip()
        state = row.get('state', '').strip()
        
        if not name: continue
        if len(name) > 255: name = name[:255]
        
        if name.lower() not in seen_names:
            seen_names.add(name.lower())
            values.append(f"({escape_sql(name)}, {escape_sql(city)}, {escape_sql(state)})")

chunks = [values[i:i + 5000] for i in range(0, len(values), 5000)]

with open('/Users/saranshsuman/Desktop/ComingSoon/scratch_insert.sql', 'w') as f:
    f.write("TRUNCATE TABLE colleges CASCADE;\n")
    for chunk in chunks:
        f.write("INSERT INTO colleges (name, city, state) VALUES\n")
        f.write(",\n".join(chunk))
        f.write("\nON CONFLICT (name) DO NOTHING;\n\n")

print(f"Generated SQL with {len(values)} inserts.")
