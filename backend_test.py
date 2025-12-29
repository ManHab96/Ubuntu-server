#!/usr/bin/env python3
"""
Backend Testing Suite for Automotive Agency Platform
Tests authentication, AI chat, cars CRUD, and appointments CRUD
"""

import asyncio
import httpx
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any

# Get backend URL from frontend .env
BACKEND_URL = "https://autodealer-ai.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.agency_id = None
        self.test_results = {}
        
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend Testing Suite")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test authentication first
        await self.test_authentication()
        
        if not self.auth_token:
            print("❌ Authentication failed - cannot proceed with other tests")
            return self.test_results
            
        # Get agency ID for other tests
        await self.get_agency_id()
        
        # Test AI Chat (Critical - main bug reported)
        await self.test_ai_chat_responses()
        
        # Test Cars CRUD
        await self.test_cars_crud()
        
        # Test Appointments CRUD
        await self.test_appointments_crud()
        
        # Print summary
        self.print_test_summary()
        return self.test_results
    
    async def test_authentication(self):
        """Test login with provided credentials"""
        print("\n🔐 Testing Authentication...")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test login
                login_data = {
                    "email": "admin@agencia.com",
                    "password": "admin123"
                }
                
                response = await client.post(
                    f"{self.base_url}/auth/login",
                    json=login_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.auth_token = data.get("token")
                    user_info = data.get("user", {})
                    
                    print(f"✅ Login successful")
                    print(f"   User: {user_info.get('name')} ({user_info.get('email')})")
                    print(f"   Role: {user_info.get('role')}")
                    
                    self.test_results["authentication"] = {
                        "status": "PASS",
                        "details": "Login successful with admin credentials"
                    }
                else:
                    print(f"❌ Login failed: {response.status_code} - {response.text}")
                    self.test_results["authentication"] = {
                        "status": "FAIL",
                        "details": f"Login failed with status {response.status_code}"
                    }
                    
        except Exception as e:
            print(f"❌ Authentication test error: {e}")
            self.test_results["authentication"] = {
                "status": "ERROR",
                "details": str(e)
            }
    
    async def get_agency_id(self):
        """Get agency ID for testing"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                response = await client.get(f"{self.base_url}/agencies/", headers=headers)
                
                print(f"   Agencies API response: {response.status_code}")
                if response.status_code == 200:
                    agencies = response.json()
                    print(f"   Found {len(agencies)} agencies")
                    if agencies:
                        self.agency_id = agencies[0]["id"]
                        print(f"📍 Using agency: {agencies[0].get('name', 'Unknown')} (ID: {self.agency_id})")
                    else:
                        print("⚠️ No agencies found - creating test agency")
                        await self.create_test_agency()
                else:
                    print(f"   Error response: {response.text}")
                        
        except Exception as e:
            print(f"⚠️ Could not get agency ID: {e}")
    
    async def create_test_agency(self):
        """Create a test agency for testing"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                agency_data = {
                    "name": "Agencia de Prueba",
                    "address": "Calle Principal 123, Ciudad de México",
                    "phone": "+52 55 1234 5678",
                    "email": "contacto@agenciaprueba.com",
                    "business_hours": "Lunes a Sábado 9:00 - 18:00"
                }
                
                response = await client.post(f"{self.base_url}/agencies/", json=agency_data, headers=headers)
                
                if response.status_code == 200:
                    agency = response.json()
                    self.agency_id = agency["id"]
                    print(f"✅ Created test agency: {agency['name']} (ID: {self.agency_id})")
                else:
                    print(f"❌ Failed to create test agency: {response.status_code} - {response.text}")
                    
        except Exception as e:
            print(f"❌ Error creating test agency: {e}")
    
    async def test_ai_chat_responses(self):
        """Test AI chat with different messages to verify varied responses"""
        print("\n🤖 Testing AI Chat Response Generation (CRITICAL TEST)...")
        
        if not self.agency_id:
            print("❌ Cannot test AI chat - no agency ID")
            self.test_results["ai_chat"] = {
                "status": "FAIL",
                "details": "No agency ID available for testing"
            }
            return
        
        test_messages = [
            "Hola",
            "Que autos tienen?",
            "Quiero agendar una cita",
            "Cuales son sus horarios?"
        ]
        
        responses = []
        all_passed = True
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                for i, message in enumerate(test_messages):
                    print(f"   Testing message {i+1}: '{message}'")
                    
                    chat_data = {
                        "message": message,
                        "agency_id": self.agency_id,
                        "phone": f"+52123456789{i}"  # Different phone for each test
                    }
                    
                    response = await client.post(
                        f"{self.base_url}/whatsapp/test-chat",
                        json=chat_data,
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        ai_response = data.get("response", "")
                        responses.append(ai_response)
                        
                        print(f"   ✅ Response: {ai_response[:100]}...")
                    else:
                        print(f"   ❌ Failed: {response.status_code} - {response.text}")
                        all_passed = False
                        
                    # Small delay between requests
                    await asyncio.sleep(1)
            
            # Check if responses are varied (not all the same)
            unique_responses = set(responses)
            if len(unique_responses) == 1 and len(responses) > 1:
                print("❌ CRITICAL ISSUE: All AI responses are identical!")
                print(f"   Same response: {responses[0][:150]}...")
                all_passed = False
                
            elif len(unique_responses) > 1:
                print(f"✅ AI responses are varied ({len(unique_responses)} unique responses)")
                
                # Check for keyword-based intelligence
                greeting_found = any("hola" in r.lower() or "bienvenido" in r.lower() for r in responses)
                cars_found = any("auto" in r.lower() or "vehículo" in r.lower() or "disponible" in r.lower() for r in responses)
                appointment_found = any("cita" in r.lower() or "agendar" in r.lower() for r in responses)
                hours_found = any("horario" in r.lower() or "hora" in r.lower() for r in responses)
                
                intelligence_score = sum([greeting_found, cars_found, appointment_found, hours_found])
                print(f"   Intelligence check: {intelligence_score}/4 contextual responses detected")
                
                if intelligence_score >= 3:
                    print("✅ AI shows good contextual understanding")
                else:
                    print("⚠️ AI responses may lack contextual intelligence")
            
            if all_passed and len(unique_responses) > 1:
                self.test_results["ai_chat"] = {
                    "status": "PASS",
                    "details": f"AI generates varied responses ({len(unique_responses)} unique out of {len(responses)})"
                }
            else:
                self.test_results["ai_chat"] = {
                    "status": "FAIL",
                    "details": "AI responses are not varied or API calls failed"
                }
                
        except Exception as e:
            print(f"❌ AI chat test error: {e}")
            self.test_results["ai_chat"] = {
                "status": "ERROR",
                "details": str(e)
            }
    
    async def test_cars_crud(self):
        """Test Cars CRUD operations"""
        print("\n🚗 Testing Cars CRUD Operations...")
        
        if not self.agency_id:
            print("❌ Cannot test cars CRUD - no agency ID")
            self.test_results["cars_crud"] = {
                "status": "FAIL",
                "details": "No agency ID available for testing"
            }
            return
        
        created_car_id = None
        all_passed = True
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                # 1. Test GET cars (list existing)
                print("   Testing GET /cars...")
                response = await client.get(f"{self.base_url}/cars/?agency_id={self.agency_id}", headers=headers)
                
                if response.status_code == 200:
                    cars = response.json()
                    print(f"   ✅ Found {len(cars)} existing cars")
                    
                    # Check if we have the expected cars (Toyota Camry, Honda Civic, Mazda CX-5)
                    car_models = [f"{car.get('brand', '')} {car.get('model', '')}" for car in cars]
                    print(f"   Cars found: {car_models}")
                else:
                    print(f"   ❌ GET cars failed: {response.status_code}")
                    all_passed = False
                
                # 2. Test POST car (create new)
                print("   Testing POST /cars (create)...")
                new_car = {
                    "agency_id": self.agency_id,
                    "brand": "Ford",
                    "model": "Focus",
                    "year": 2023,
                    "price": 25000.00,
                    "color": "Azul",
                    "fuel_type": "Gasolina",
                    "transmission": "Manual",
                    "mileage": 0,
                    "description": "Auto de prueba para testing",
                    "is_available": True
                }
                
                response = await client.post(f"{self.base_url}/cars/", json=new_car, headers=headers)
                
                if response.status_code == 200:
                    created_car = response.json()
                    created_car_id = created_car["id"]
                    print(f"   ✅ Car created successfully (ID: {created_car_id})")
                else:
                    print(f"   ❌ POST car failed: {response.status_code} - {response.text}")
                    all_passed = False
                
                # 3. Test PUT car (update)
                if created_car_id:
                    print("   Testing PUT /cars (update)...")
                    updated_car = new_car.copy()
                    updated_car["price"] = 26000.00
                    updated_car["description"] = "Auto de prueba actualizado"
                    
                    response = await client.put(f"{self.base_url}/cars/{created_car_id}", json=updated_car, headers=headers)
                    
                    if response.status_code == 200:
                        print("   ✅ Car updated successfully")
                    else:
                        print(f"   ❌ PUT car failed: {response.status_code}")
                        all_passed = False
                
                # 4. Test GET single car
                if created_car_id:
                    print("   Testing GET /cars/{id}...")
                    response = await client.get(f"{self.base_url}/cars/{created_car_id}", headers=headers)
                    
                    if response.status_code == 200:
                        car = response.json()
                        print(f"   ✅ Retrieved car: {car['brand']} {car['model']} - ${car['price']}")
                    else:
                        print(f"   ❌ GET single car failed: {response.status_code}")
                        all_passed = False
                
                # 5. Test DELETE car (cleanup)
                if created_car_id:
                    print("   Testing DELETE /cars (cleanup)...")
                    response = await client.delete(f"{self.base_url}/cars/{created_car_id}", headers=headers)
                    
                    if response.status_code == 200:
                        print("   ✅ Car deleted successfully")
                    else:
                        print(f"   ❌ DELETE car failed: {response.status_code}")
                        all_passed = False
            
            if all_passed:
                self.test_results["cars_crud"] = {
                    "status": "PASS",
                    "details": "All CRUD operations working correctly"
                }
            else:
                self.test_results["cars_crud"] = {
                    "status": "FAIL",
                    "details": "Some CRUD operations failed"
                }
                
        except Exception as e:
            print(f"❌ Cars CRUD test error: {e}")
            self.test_results["cars_crud"] = {
                "status": "ERROR",
                "details": str(e)
            }
    
    async def test_appointments_crud(self):
        """Test Appointments CRUD operations"""
        print("\n📅 Testing Appointments CRUD Operations...")
        
        if not self.agency_id:
            print("❌ Cannot test appointments CRUD - no agency ID")
            self.test_results["appointments_crud"] = {
                "status": "FAIL",
                "details": "No agency ID available for testing"
            }
            return
        
        created_appointment_id = None
        all_passed = True
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                # 1. Test GET appointments (list existing)
                print("   Testing GET /appointments...")
                response = await client.get(f"{self.base_url}/appointments?agency_id={self.agency_id}", headers=headers)
                
                if response.status_code == 200:
                    appointments = response.json()
                    print(f"   ✅ Found {len(appointments)} existing appointments")
                else:
                    print(f"   ❌ GET appointments failed: {response.status_code}")
                    all_passed = False
                
                # 2. Test POST appointment (create new)
                print("   Testing POST /appointments (create)...")
                future_date = datetime.utcnow() + timedelta(days=7)
                new_appointment = {
                    "agency_id": self.agency_id,
                    "customer_name": "Juan Pérez",
                    "customer_phone": "+521234567890",
                    "customer_email": "juan.perez@test.com",
                    "appointment_date": future_date.isoformat(),
                    "service_type": "Consulta de venta",
                    "notes": "Interesado en Toyota Camry"
                }
                
                response = await client.post(f"{self.base_url}/appointments/", json=new_appointment, headers=headers)
                
                if response.status_code == 200:
                    created_appointment = response.json()
                    created_appointment_id = created_appointment["id"]
                    print(f"   ✅ Appointment created successfully (ID: {created_appointment_id})")
                else:
                    print(f"   ❌ POST appointment failed: {response.status_code} - {response.text}")
                    all_passed = False
                
                # 3. Test GET single appointment
                if created_appointment_id:
                    print("   Testing GET /appointments/{id}...")
                    response = await client.get(f"{self.base_url}/appointments/{created_appointment_id}", headers=headers)
                    
                    if response.status_code == 200:
                        appointment = response.json()
                        print(f"   ✅ Retrieved appointment for {appointment['customer_name']}")
                    else:
                        print(f"   ❌ GET single appointment failed: {response.status_code}")
                        all_passed = False
                
                # 4. Test PATCH appointment status
                if created_appointment_id:
                    print("   Testing PATCH /appointments/{id}/status...")
                    response = await client.patch(
                        f"{self.base_url}/appointments/{created_appointment_id}/status?status=confirmed",
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        print("   ✅ Appointment status updated successfully")
                    else:
                        print(f"   ❌ PATCH appointment status failed: {response.status_code}")
                        all_passed = False
                
                # 5. Test today's appointments
                print("   Testing GET /appointments/today...")
                response = await client.get(f"{self.base_url}/appointments/today?agency_id={self.agency_id}", headers=headers)
                
                if response.status_code == 200:
                    today_appointments = response.json()
                    print(f"   ✅ Found {len(today_appointments)} appointments for today")
                else:
                    print(f"   ❌ GET today appointments failed: {response.status_code}")
                    all_passed = False
                
                # 6. Test DELETE appointment (cleanup)
                if created_appointment_id:
                    print("   Testing DELETE /appointments (cancel)...")
                    response = await client.delete(f"{self.base_url}/appointments/{created_appointment_id}", headers=headers)
                    
                    if response.status_code == 200:
                        print("   ✅ Appointment cancelled successfully")
                    else:
                        print(f"   ❌ DELETE appointment failed: {response.status_code}")
                        all_passed = False
            
            if all_passed:
                self.test_results["appointments_crud"] = {
                    "status": "PASS",
                    "details": "All CRUD operations working correctly"
                }
            else:
                self.test_results["appointments_crud"] = {
                    "status": "FAIL",
                    "details": "Some CRUD operations failed"
                }
                
        except Exception as e:
            print(f"❌ Appointments CRUD test error: {e}")
            self.test_results["appointments_crud"] = {
                "status": "ERROR",
                "details": str(e)
            }
    
    def print_test_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 BACKEND TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["status"] == "PASS")
        failed_tests = sum(1 for result in self.test_results.values() if result["status"] == "FAIL")
        error_tests = sum(1 for result in self.test_results.values() if result["status"] == "ERROR")
        
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⚠️"
            print(f"{status_icon} {test_name.upper()}: {result['status']}")
            print(f"   {result['details']}")
        
        print(f"\nSUMMARY: {passed_tests}/{total_tests} tests passed")
        if failed_tests > 0:
            print(f"⚠️ {failed_tests} tests failed")
        if error_tests > 0:
            print(f"⚠️ {error_tests} tests had errors")

async def main():
    """Main test runner"""
    tester = BackendTester()
    results = await tester.run_all_tests()
    return results

if __name__ == "__main__":
    asyncio.run(main())