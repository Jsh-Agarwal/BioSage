import asyncio
import sys
import os
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

# Add the parent directory to Python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database connection and initialize it
from app.database import get_database, init_database
from app.db import (
    user_crud, patient_crud, case_crud, vitals_crud, labs_crud, 
    medical_history_crud, social_history_crud, orders_crud,
    research_suggestions_crud, clinical_trials_crud, evidence_crud,
    collaborations_crud, agents_crud, audit_logs_crud, system_events_crud,
    specialist_results_crud, integrated_results_crud, feedback_crud
)
from app.models.user import UserRole, UserStatus
from app.models.patient import Gender
from app.models.case import CaseStatus, CaseUrgency
from app.models.vitals_labs import LabStatus
from app.models.history import AllergySeverity, MedicationStatus, ConditionStatus
from app.models.core import OrderPriority, OrderStatus, AuditSeverity, SystemEventStatus, AgentStatus
from app.models.research import ResearchPriority, TrialPhase, TrialStatus, EvidenceType
from bson import ObjectId

class DummyDataGenerator:
    def __init__(self):
        self.users = []
        self.patients = []
        self.cases = []
        
    async def generate_users(self, count: int = 8) -> List[str]:
        """Generate dummy users"""
        print("Creating users...")
        user_data = [
            {"name": "Dr. Sarah Johnson", "email": "sarah.johnson@hospital.com", "role": UserRole.CLINICIAN.value, "password_hash": "hashed_password_1"},
            {"name": "Dr. Michael Chen", "email": "michael.chen@hospital.com", "role": UserRole.CLINICIAN.value, "password_hash": "hashed_password_2"},
            {"name": "Dr. Emily Rodriguez", "email": "emily.rodriguez@hospital.com", "role": UserRole.CLINICIAN.value, "password_hash": "hashed_password_3"},
            {"name": "Dr. James Wilson", "email": "james.wilson@hospital.com", "role": UserRole.CLINICIAN.value, "password_hash": "hashed_password_4"},
            {"name": "Dr. Lisa Thompson", "email": "lisa.thompson@hospital.com", "role": UserRole.CLINICIAN.value, "password_hash": "hashed_password_5"},
            {"name": "Admin User", "email": "admin@hospital.com", "role": UserRole.ADMIN.value, "password_hash": "hashed_admin_password"},
            {"name": "System Monitor", "email": "system@hospital.com", "role": UserRole.SYSTEM.value, "password_hash": "hashed_system_password"},
            {"name": "Dr. Robert Davis", "email": "robert.davis@hospital.com", "role": UserRole.CLINICIAN.value, "password_hash": "hashed_password_6"}
        ]
        
        user_ids = []
        for user in user_data:
            try:
                user["created_at"] = datetime.utcnow()
                user["status"] = UserStatus.ACTIVE.value
                user_id = await user_crud.create(user)
                user_ids.append(str(user_id))
                self.users.append(user)
                print(f"✓ Created user: {user['name']}")
            except Exception as e:
                print(f"✗ Failed to create user {user['name']}: {str(e)}")
                continue
        
        return user_ids

    async def generate_patients(self, count: int = 10) -> List[str]:
        """Generate dummy patients"""
        print("Creating patients...")
        patient_data = [
            {"name": "John Smith", "dob": "1985-03-15", "gender": Gender.MALE.value, "mrn": "MRN001", 
             "phone": "(555) 123-4567", "email": "john.smith@email.com", "address": "123 Main St, City, ST 12345"},
            {"name": "Maria Garcia", "dob": "1992-07-22", "gender": Gender.FEMALE.value, "mrn": "MRN002",
             "phone": "(555) 234-5678", "email": "maria.garcia@email.com", "address": "456 Oak Ave, City, ST 12346"},
            {"name": "Robert Johnson", "dob": "1978-11-08", "gender": Gender.MALE.value, "mrn": "MRN003",
             "phone": "(555) 345-6789", "email": "robert.johnson@email.com", "address": "789 Pine Rd, City, ST 12347"},
            {"name": "Emily Davis", "dob": "1990-05-14", "gender": Gender.FEMALE.value, "mrn": "MRN004",
             "phone": "(555) 456-7890", "email": "emily.davis@email.com", "address": "321 Elm St, City, ST 12348"},
            {"name": "Michael Brown", "dob": "1965-12-03", "gender": Gender.MALE.value, "mrn": "MRN005",
             "phone": "(555) 567-8901", "email": "michael.brown@email.com", "address": "654 Maple Dr, City, ST 12349"},
            {"name": "Sarah Wilson", "dob": "1988-09-27", "gender": Gender.FEMALE.value, "mrn": "MRN006",
             "phone": "(555) 678-9012", "email": "sarah.wilson@email.com", "address": "987 Cedar Ln, City, ST 12350"},
            {"name": "David Miller", "dob": "1975-04-18", "gender": Gender.MALE.value, "mrn": "MRN007",
             "phone": "(555) 789-0123", "email": "david.miller@email.com", "address": "147 Birch Ave, City, ST 12351"},
            {"name": "Jennifer Taylor", "dob": "1995-08-11", "gender": Gender.FEMALE.value, "mrn": "MRN008",
             "phone": "(555) 890-1234", "email": "jennifer.taylor@email.com", "address": "258 Spruce St, City, ST 12352"},
            {"name": "Christopher Anderson", "dob": "1982-01-25", "gender": Gender.MALE.value, "mrn": "MRN009",
             "phone": "(555) 901-2345", "email": "chris.anderson@email.com", "address": "369 Willow Rd, City, ST 12353"},
            {"name": "Lisa Martinez", "dob": "1987-06-30", "gender": Gender.FEMALE.value, "mrn": "MRN010",
             "phone": "(555) 012-3456", "email": "lisa.martinez@email.com", "address": "741 Ash Dr, City, ST 12354"}
        ]
        
        patient_ids = []
        for patient in patient_data:
            try:
                patient["created_at"] = datetime.utcnow()
                patient["insurance"] = f"Insurance-{random.randint(1000, 9999)}"
                patient["primary_care"] = f"Dr. Primary-{random.randint(1, 10)}"
                patient_id = await patient_crud.create(patient)
                patient_ids.append(str(patient_id))
                self.patients.append(patient)
                print(f"✓ Created patient: {patient['name']} (MRN: {patient['mrn']})")
            except Exception as e:
                print(f"✗ Failed to create patient {patient['name']}: {str(e)}")
                continue
        
        return patient_ids

    async def generate_cases(self, patient_ids: List[str], count: int = 12) -> List[str]:
        """Generate dummy cases"""
        print("Creating cases...")
        chief_complaints = [
            "Chest pain with shortness of breath",
            "Severe headache with visual disturbances", 
            "Abdominal pain and nausea",
            "Fever and productive cough",
            "Joint pain and swelling",
            "Dizziness and palpitations",
            "Difficulty breathing",
            "Skin rash with itching",
            "Back pain radiating to leg",
            "Confusion and memory loss",
            "Persistent fatigue",
            "Unexplained weight loss"
        ]
        
        diagnoses = [
            "Acute myocardial infarction",
            "Migraine with aura",
            "Acute appendicitis",
            "Community-acquired pneumonia",
            "Rheumatoid arthritis",
            "Atrial fibrillation",
            "Acute asthma exacerbation",
            "Contact dermatitis",
            "Herniated disc",
            "Mild cognitive impairment",
            "Chronic fatigue syndrome",
            "Hyperthyroidism"
        ]
        
        case_ids = []
        for i in range(count):
            try:
                patient_id = random.choice(patient_ids)
                case_data = {
                    "case_id": f"BSG-2024-{i+1:03d}",
                    "patient_id": ObjectId(patient_id),
                    "chief_complaint": chief_complaints[i],
                    "admission_date": (datetime.utcnow() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
                    "status": random.choice(list(CaseStatus)).value,
                    "current_dx": diagnoses[i] if random.random() > 0.3 else None,
                    "assigned_team": random.sample([user["email"] for user in self.users[:5]], random.randint(1, 3)),
                    "urgency": random.choice(list(CaseUrgency)).value,
                    "confidence": random.randint(70, 95) if random.random() > 0.4 else None,
                    "top_dx": diagnoses[i] if random.random() > 0.2 else None,
                    "last_update": datetime.utcnow()
                }
                
                case_id = await case_crud.create(case_data)
                case_ids.append(str(case_id))
                self.cases.append(case_data)
                print(f"✓ Created case: {case_data['case_id']} - {case_data['chief_complaint'][:50]}...")
            except Exception as e:
                print(f"✗ Failed to create case {i+1}: {str(e)}")
                continue
        
        return case_ids

    async def generate_vitals(self, case_ids: List[str], count: int = 20):
        """Generate dummy vitals"""
        print("Creating vitals...")
        created_count = 0
        for _ in range(count):
            try:
                case_id = random.choice(case_ids)
                vitals_data = {
                    "case_id": ObjectId(case_id),
                    "timestamp": datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
                    "temperature": f"{random.uniform(97.0, 102.0):.1f}°F",
                    "bp": f"{random.randint(90, 180)}/{random.randint(60, 110)}",
                    "hr": f"{random.randint(60, 120)} bpm",
                    "rr": f"{random.randint(12, 24)}/min",
                    "o2sat": f"{random.randint(92, 100)}%",
                    "weight": f"{random.randint(50, 120)} kg"
                }
                
                await vitals_crud.create(vitals_data)
                created_count += 1
            except Exception as e:
                print(f"✗ Failed to create vitals: {str(e)}")
                continue
        print(f"✓ Created {created_count} vitals records")

    async def generate_labs(self, case_ids: List[str], count: int = 25):
        """Generate dummy lab results"""
        print("Creating lab results...")
        lab_tests = [
            {"test": "Complete Blood Count", "value": f"WBC: {random.randint(4, 12)}k/uL", "reference": "4-11 k/uL"},
            {"test": "Basic Metabolic Panel", "value": f"Glucose: {random.randint(70, 200)} mg/dL", "reference": "70-100 mg/dL"},
            {"test": "Liver Function Tests", "value": f"ALT: {random.randint(10, 80)} U/L", "reference": "7-40 U/L"},
            {"test": "Lipid Panel", "value": f"Total Cholesterol: {random.randint(150, 300)} mg/dL", "reference": "<200 mg/dL"},
            {"test": "Thyroid Function", "value": f"TSH: {random.uniform(0.5, 8.0):.2f} mIU/L", "reference": "0.4-4.0 mIU/L"},
            {"test": "Cardiac Enzymes", "value": f"Troponin: {random.uniform(0.01, 2.0):.2f} ng/mL", "reference": "<0.04 ng/mL"},
            {"test": "Urinalysis", "value": "Normal", "reference": "Normal"},
            {"test": "HbA1c", "value": f"{random.uniform(5.0, 12.0):.1f}%", "reference": "<7.0%"}
        ]
        
        created_count = 0
        for _ in range(count):
            try:
                case_id = random.choice(case_ids)
                lab = random.choice(lab_tests)
                lab_data = {
                    "case_id": ObjectId(case_id),
                    "test": lab["test"],
                    "value": lab["value"],
                    "reference": lab["reference"],
                    "status": random.choice(list(LabStatus)).value,
                    "date": (datetime.utcnow() - timedelta(days=random.randint(0, 5))).strftime("%Y-%m-%d")
                }
                
                await labs_crud.create(lab_data)
                created_count += 1
            except Exception as e:
                print(f"✗ Failed to create lab: {str(e)}")
                continue
        print(f"✓ Created {created_count} lab results")

    async def generate_medical_history(self, patient_ids: List[str]):
        """Generate medical history for patients"""
        print("Creating medical history...")
        allergies = [
            {"allergen": "Penicillin", "reaction": "Rash", "severity": AllergySeverity.MODERATE.value},
            {"allergen": "Shellfish", "reaction": "Anaphylaxis", "severity": AllergySeverity.LIFE_THREATENING.value},
            {"allergen": "Latex", "reaction": "Contact dermatitis", "severity": AllergySeverity.MILD.value}
        ]
        
        medications = [
            {"name": "Lisinopril", "dose": "10mg daily", "indication": "Hypertension", "started": "2023-01-15", "status": MedicationStatus.ACTIVE.value},
            {"name": "Metformin", "dose": "500mg twice daily", "indication": "Type 2 Diabetes", "started": "2022-06-10", "status": MedicationStatus.ACTIVE.value},
            {"name": "Atorvastatin", "dose": "20mg nightly", "indication": "High cholesterol", "started": "2023-03-20", "status": MedicationStatus.ACTIVE.value}
        ]
        
        conditions = [
            {"condition": "Hypertension", "diagnosed": "2023-01-15", "status": ConditionStatus.ACTIVE.value},
            {"condition": "Type 2 Diabetes", "diagnosed": "2022-06-10", "status": ConditionStatus.ACTIVE.value},
            {"condition": "Hyperlipidemia", "diagnosed": "2023-03-20", "status": ConditionStatus.ACTIVE.value}
        ]
        
        created_count = 0
        for patient_id in patient_ids[:5]:  # Create history for first 5 patients
            try:
                history_data = {
                    "patient_id": ObjectId(patient_id),
                    "allergies": random.sample(allergies, random.randint(0, 2)),
                    "medications": random.sample(medications, random.randint(1, 3)),
                    "conditions": random.sample(conditions, random.randint(1, 2)),
                    "surgeries": []
                }
                
                await medical_history_crud.create(history_data)
                created_count += 1
            except Exception as e:
                print(f"✗ Failed to create medical history for patient {patient_id}: {str(e)}")
                continue
        print(f"✓ Created {created_count} medical history records")

    async def generate_social_history(self, patient_ids: List[str]):
        """Generate social history for patients"""
        print("Creating social history...")
        created_count = 0
        for patient_id in patient_ids[:5]:  # Create history for first 5 patients
            try:
                history_data = {
                    "patient_id": ObjectId(patient_id),
                    "occupation": random.choice(["Teacher", "Engineer", "Nurse", "Retired", "Student"]),
                    "smoking": random.choice(["Never", "Former - quit 5 years ago", "Current - 1 pack/day"]),
                    "alcohol": random.choice(["None", "Social drinker", "2-3 drinks/week"]),
                    "drugs": "None",
                    "exercise": random.choice(["Sedentary", "Light exercise 2-3x/week", "Regular exercise"]),
                    "diet": "Regular diet",
                    "travel": "No recent travel",
                    "exposure": "No significant exposures"
                }
                
                await social_history_crud.create(history_data)
                created_count += 1
            except Exception as e:
                print(f"✗ Failed to create social history for patient {patient_id}: {str(e)}")
                continue
        print(f"✓ Created {created_count} social history records")

    async def generate_orders(self, case_ids: List[str], count: int = 15):
        """Generate dummy orders"""
        print("Creating orders...")
        order_types = [
            {"test_name": "Chest X-ray", "category": "Imaging", "cost": 150.0},
            {"test_name": "CT Chest", "category": "Imaging", "cost": 800.0},
            {"test_name": "Echocardiogram", "category": "Cardiac", "cost": 600.0},
            {"test_name": "Stress Test", "category": "Cardiac", "cost": 1200.0},
            {"test_name": "MRI Brain", "category": "Imaging", "cost": 2000.0},
            {"test_name": "Blood Culture", "category": "Laboratory", "cost": 75.0},
            {"test_name": "Arterial Blood Gas", "category": "Laboratory", "cost": 50.0}
        ]
        
        created_count = 0
        for _ in range(count):
            try:
                case_id = random.choice(case_ids)
                order = random.choice(order_types)
                order_data = {
                    "case_id": ObjectId(case_id),
                    "test_name": order["test_name"],
                    "category": order["category"],
                    "cost": order["cost"],
                    "turnaround_time": f"{random.randint(1, 48)} hours",
                    "priority": random.choice(list(OrderPriority)).value,
                    "ai_recommendation": random.choice([True, False]),
                    "status": random.choice(list(OrderStatus)).value,
                    "ordered_by": random.choice([user["email"] for user in self.users[:5]]),
                    "order_time": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                    "rationale": "Clinical indication based on patient presentation"
                }
                
                await orders_crud.create(order_data)
                created_count += 1
            except Exception as e:
                print(f"✗ Failed to create order: {str(e)}")
                continue
        print(f"✓ Created {created_count} orders")

    async def generate_research_data(self):
        """Generate research suggestions, clinical trials, and evidence"""
        print("Creating research data...")
        try:
            # Research Suggestions
            suggestions = [
                {
                    "title": "Novel Biomarkers for Early Detection",
                    "category": "Diagnostics",
                    "confidence": 0.85,
                    "relevance": "High",
                    "description": "Investigation of novel biomarkers for early disease detection",
                    "suggested_actions": ["Literature review", "Biomarker validation"],
                    "similar_cases": 15,
                    "literature": 45,
                    "priority": ResearchPriority.HIGH.value
                },
                {
                    "title": "AI-Assisted Diagnostic Accuracy",
                    "category": "Artificial Intelligence",
                    "confidence": 0.92,
                    "relevance": "Very High",
                    "description": "Evaluating AI model performance in clinical diagnosis",
                    "suggested_actions": ["Model validation", "Clinical trial"],
                    "similar_cases": 30,
                    "literature": 78,
                    "priority": ResearchPriority.HIGH.value
                }
            ]
            
            for suggestion in suggestions:
                await research_suggestions_crud.create(suggestion)
                print(f"✓ Created research suggestion: {suggestion['title']}")
            
            # Clinical Trials
            trials = [
                {
                    "title": "Phase III Trial of Novel Cardiac Drug",
                    "phase": TrialPhase.PHASE_III.value,
                    "status": TrialStatus.RECRUITING.value,
                    "location": "University Hospital, City, ST",
                    "estimated_enrollment": 500,
                    "eligibility": "Adults 18-75 with heart failure",
                    "primary_endpoint": "Reduction in cardiovascular events",
                    "contact_info": "trials@university.edu",
                    "match_score": 0.78
                },
                {
                    "title": "Immunotherapy for Cancer Treatment",
                    "phase": TrialPhase.PHASE_II.value,
                    "status": TrialStatus.ACTIVE.value,
                    "location": "Cancer Center, City, ST",
                    "estimated_enrollment": 200,
                    "eligibility": "Stage III-IV cancer patients",
                    "primary_endpoint": "Overall survival",
                    "contact_info": "oncology@cancercenter.org",
                    "match_score": 0.65
                }
            ]
            
            for trial in trials:
                await clinical_trials_crud.create(trial)
                print(f"✓ Created clinical trial: {trial['title']}")
            
            # Evidence
            evidence_data = [
                {
                    "title": "Effectiveness of Remote Patient Monitoring",
                    "authors": "Smith, J. et al.",
                    "journal": "Journal of Medical Innovation",
                    "year": 2023,
                    "citation_count": 45,
                    "quality_score": 0.89,
                    "evidence_type": EvidenceType.RCT.value,
                    "key_findings": "Remote monitoring reduced hospital readmissions by 25%",
                    "relevance_score": 0.92,
                    "tags": ["telemedicine", "remote monitoring", "outcomes"]
                },
                {
                    "title": "AI in Medical Diagnosis: A Systematic Review",
                    "authors": "Johnson, M. et al.",
                    "journal": "AI in Medicine",
                    "year": 2024,
                    "citation_count": 12,
                    "quality_score": 0.94,
                    "evidence_type": EvidenceType.SYSTEMATIC_REVIEW.value,
                    "key_findings": "AI diagnostic tools show 15% improvement over traditional methods",
                    "relevance_score": 0.88,
                    "tags": ["artificial intelligence", "diagnosis", "accuracy"]
                }
            ]
            
            for evidence in evidence_data:
                await evidence_crud.create(evidence)
                print(f"✓ Created evidence: {evidence['title']}")
        except Exception as e:
            print(f"✗ Failed to create research data: {str(e)}")

    async def generate_agents_data(self):
        """Generate agents data"""
        print("Creating agents...")
        try:
            agents_data = [
                {
                    "name": "CardioAgent",
                    "icon": "heart",
                    "status": AgentStatus.ONLINE.value,
                    "confidence": 92,
                    "active_cases": 15,
                    "avg_response_time": "1.2s",
                    "accuracy": "94.2%",
                    "capabilities": ["ECG analysis", "Risk stratification", "Treatment recommendations"],
                    "model_version": "v2.1.0",
                    "recent_cases": []
                },
                {
                    "name": "PulmoAgent",
                    "icon": "lungs",
                    "status": AgentStatus.ONLINE.value,
                    "confidence": 88,
                    "active_cases": 12,
                    "avg_response_time": "0.9s",
                    "accuracy": "91.7%",
                    "capabilities": ["Chest X-ray analysis", "Spirometry interpretation", "Drug interactions"],
                    "model_version": "v1.8.2",
                    "recent_cases": []
                },
                {
                    "name": "NeuroAgent",
                    "icon": "brain",
                    "status": AgentStatus.MAINTENANCE.value,
                    "confidence": 85,
                    "active_cases": 8,
                    "avg_response_time": "2.1s",
                    "accuracy": "89.3%",
                    "capabilities": ["Neurological assessment", "Imaging analysis", "Cognitive evaluation"],
                    "model_version": "v1.5.1",
                    "recent_cases": []
                }
            ]
            
            for agent in agents_data:
                await agents_crud.create(agent)
                print(f"✓ Created agent: {agent['name']}")
        except Exception as e:
            print(f"✗ Failed to create agents: {str(e)}")

    async def run_complete_ingestion(self):
        """Run complete data ingestion"""
        print("Starting dummy data ingestion...")
        
        try:
            # Initialize database connection
            print("Initializing database connection...")
            await init_database()
            print("✓ Database connection established")
            
            # Generate base data
            print("\n=== Creating Users ===")
            user_ids = await self.generate_users()
            
            print(f"\n=== Creating Patients ===")
            patient_ids = await self.generate_patients()
            
            print(f"\n=== Creating Cases ===")
            case_ids = await self.generate_cases(patient_ids)
            
            # Generate related medical data
            print(f"\n=== Creating Vitals ===")
            await self.generate_vitals(case_ids)
            
            print(f"\n=== Creating Labs ===")
            await self.generate_labs(case_ids)
            
            print(f"\n=== Creating Medical History ===")
            await self.generate_medical_history(patient_ids)
            
            print(f"\n=== Creating Social History ===")
            await self.generate_social_history(patient_ids)
            
            print(f"\n=== Creating Orders ===")
            await self.generate_orders(case_ids)
            
            # Generate research and system data
            print(f"\n=== Creating Research Data ===")
            await self.generate_research_data()
            
            print(f"\n=== Creating Agents Data ===")
            await self.generate_agents_data()
            
            print("\n" + "="*60)
            print("✅ Dummy data ingestion completed successfully!")
            print(f"Created: {len(self.users)} users, {len(self.patients)} patients, {len(self.cases)} cases")
            
        except Exception as e:
            print(f"❌ Error during data ingestion: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

async def main():
    """Main function to run data ingestion"""
    generator = DummyDataGenerator()
    await generator.run_complete_ingestion()

if __name__ == "__main__":
    asyncio.run(main())
