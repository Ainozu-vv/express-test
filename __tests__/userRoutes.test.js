const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const router = require("../routes/userRoutes");
const User = require("../models/user");

// A függőségek mockolása, hogy izolált tesztkörnyezetet teremtsünk
// Nem akarunk valódi adatbázisműveleteket végrehajtani a tesztek során
jest.mock("../models/user");
jest.mock("bcryptjs");

// Express alkalmazás beállítása a teszteléshez
// Ez egy minimális Express app, ami csak a felhasználói útvonalakat tartalmazza
const app = express();
app.use(express.json());
app.use("/users", router);

describe("User routes", () => {
  // Minden teszt előtt töröljük a mock hívásinformációkat
  // Így minden teszt tiszta állapotból indul
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    it("201 after successful register", async () => {
      // Beállítjuk a jelszó hashelést, hogy konzisztens értéket adjon vissza
      bcrypt.hash.mockResolvedValue("hashedPassword123");
      
      // Mock felhasználó objektum létrehozása, amit a User.create majd visszaad
      const mockUser = {
        id: 1,
        username: "testuser",
        role: "user",
        password: "hashedPassword123",
      };
      
      // Beállítjuk, hogy a User.create a mock felhasználót adja vissza
      User.create.mockResolvedValue(mockUser);

      // HTTP kérés küldése a regisztrációs végpontra
      const response = await request(app).post("/users/register").send({
        username: "testuser",
        password: "password123",
        role: "user",
      });

      // Ellenőrizzük a válasz helyességét
      expect(response.status).toBe(201); // 201 - Created - sikeres létrehozás
      expect(response.body).toEqual(mockUser);
      // Ellenőrizzük, hogy a bcrypt.hash a megfelelő paraméterekkel lett meghívva
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      // Ellenőrizzük, hogy a User.create a megfelelő adatokkal lett meghívva
      expect(User.create).toHaveBeenCalledWith({
        username: "testuser",
        password: "hashedPassword123",
        role: "user",
      });
    });

    it("500 if reg fails", async () => {
      // Beállítjuk a jelszó hashelést
      bcrypt.hash.mockResolvedValue("hashedPassword123");
      // A User.create műveletet hiba dobására állítjuk
      User.create.mockRejectedValue(new Error("Database error"));

      // HTTP kérés küldése a regisztrációs végpontra
      const response = await request(app).post("/users/register").send({
        username: "testuser",
        password: "password123",
        role: "user",
      });

      // Ellenőrizzük, hogy a végpont megfelelően kezeli a hibát
      expect(response.status).toBe(500); // 500 - Szerver oldali hiba
      expect(response.body).toHaveProperty(
        "message",
        "Hiba történt a regisztráció során."
      );
      expect(response.body).toHaveProperty("error"); // Hibaüzenet is megjelenik
    });
  });

  describe("POST /login", () => {
    it("should login if u.n. and pw is correct", async () => {
      // Mock felhasználó létrehozása a bejelentkezéshez
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedPassword123",
        role: "user",
      };
      // Beállítjuk, hogy a User.findOne találja meg a felhasználót
      User.findOne.mockResolvedValue(mockUser);
      // Beállítjuk, hogy a jelszó ellenőrzés sikeres legyen
      bcrypt.compare.mockResolvedValue(true);

      // HTTP kérés küldése a bejelentkezési végpontra
      const response = await request(app).post("/users/login").send({
        username: "testuser",
        password: "password123",
      });

      // Ellenőrizzük a sikeres bejelentkezés válaszát
      expect(response.status).toBe(200); // 200 - OK
      expect(response.body).toHaveProperty("message", "Sikeres bejelentkezés!");
      expect(response.body).toHaveProperty("user", mockUser);
      // Ellenőrizzük, hogy a felhasználó keresés a megfelelő paraméterekkel történt
      expect(User.findOne).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
      // Ellenőrizzük, hogy a jelszó összehasonlítás megfelelően történt
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword123"
      );
    });

    it("should return 404 when user is not found", async () => {
      // Beállítjuk, hogy a User.findOne ne találjon felhasználót
      User.findOne.mockResolvedValue(null);

      // HTTP kérés küldése nem létező felhasználóval
      const response = await request(app).post("/users/login").send({
        username: "nonexistentuser",
        password: "password123",
      });

      // Ellenőrizzük a megfelelő hibaválaszt
      expect(response.status).toBe(404); // 404 - Not Found
      expect(response.body).toHaveProperty(
        "message",
        "Felhasználó nem található!"
      );
      // Ellenőrizzük, hogy a jelszó ellenőrzés nem történt meg, mivel a felhasználó nem létezik
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return 400 when pw not correct", async () => {
      // Mock felhasználó létrehozása hibás jelszóval történő bejelentkezéshez
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedPassword123",
        role: "user",
      };

      // Beállítjuk, hogy a User.findOne találja meg a felhasználót
      User.findOne.mockResolvedValue(mockUser);
      // Beállítjuk, hogy a jelszó ellenőrzés sikertelen legyen
      bcrypt.compare.mockResolvedValue(false);

      // HTTP kérés küldése hibás jelszóval
      const response = await request(app).post("/users/login").send({
        username: "testuser",
        password: "wrongPassword",
      });

      // Ellenőrizzük a hibás jelszó válaszát
      expect(response.status).toBe(400); // 400 - Bad Request
      expect(response.body).toHaveProperty("message", "Hibás jelszó!");
    });

    it("should return 500 when login process fails", async () => {
      // Beállítjuk, hogy a User.findOne hibát dobjon
      User.findOne.mockRejectedValue(new Error("Database error"));

      // HTTP kérés küldése a bejelentkezési végpontra
      const response = await request(app).post("/users/login").send({
        username: "testuser",
        password: "password123",
      });

      // Ellenőrizzük a szerveroldali hiba kezelését
      expect(response.status).toBe(500); // 500 - Szerver oldali hiba
      expect(response.body).toHaveProperty(
        "message",
        "Hiba történt a bejelentkezés során."
      );
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete user successfully", async () => {
      // Mock felhasználó létrehozása törlési művelethez
      const mockUser = {
        id: 1,
        username: "testuser",
        // A destroy metódus mockolása a törlés teszteléséhez
        destroy: jest.fn().mockResolvedValue(true),
      };

      // Beállítjuk, hogy a User.findByPk találja meg a felhasználót
      User.findByPk.mockResolvedValue(mockUser);

      // HTTP törlési kérés küldése
      const response = await request(app).delete("/users/1");

      // Ellenőrizzük a sikeres törlés válaszát
      expect(response.status).toBe(200); // 200 - OK
      expect(response.body).toHaveProperty("message", "Felhasználó törölve!");
      // Ellenőrizzük, hogy a destroy metódus meghívásra került
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it("should return 404 when user not found", async () => {
      // Beállítjuk, hogy a User.findByPk ne találjon felhasználót
      User.findByPk.mockResolvedValue(null);
      
      // HTTP törlési kérés küldése nem létező felhasználói azonosítóval
      const response = await request(app).delete("/users/999");

      // Ellenőrizzük a nem található felhasználó hibaválaszát
      expect(response.status).toBe(404); // 404 - Not Found
      expect(response.body).toHaveProperty(
        "message",
        "Felhasználó nem található!"
      );
    });

    it("should return 500 deletion fails", async () => {
      // Beállítjuk, hogy a User.findByPk hibát dobjon
      User.findByPk.mockRejectedValue(new Error("Database error"));
      
      // HTTP törlési kérés küldése
      const response = await request(app).delete("/users/1");

      // Ellenőrizzük a szerveroldali hiba kezelését
      expect(response.status).toBe(500); // 500 - Szerver oldali hiba
      expect(response.body).toHaveProperty(
        "message",
        "Hiba történt a felhasználó törlésekor."
      );
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /:id", () => {
    it("should return user data without pw", async () => {
      // Mock felhasználó létrehozása lekérdezéshez, toJSON metódussal
      const mockUser = {
        id: 1,
        username: "testuser",
        password: "hashedPassword123",
        role: "user",
        // A toJSON metódus mockolása, hogy tesztelhessük a jelszó eltávolítását
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          username: "testuser",
          password: "hashedPassword123",
          role: "user",
        }),
      };
      // Beállítjuk, hogy a User.findByPk találja meg a felhasználót
      User.findByPk.mockResolvedValue(mockUser);

      // HTTP GET kérés küldése
      const response = await request(app).get("/users/1");

      // Ellenőrizzük a sikeres lekérdezés válaszát
      expect(response.status).toBe(200); // 200 - OK
      // Ellenőrizzük, hogy a jelszó nem szerepel a válaszban
      expect(response.body).not.toHaveProperty("password");
      // Ellenőrizzük, hogy a többi adat megfelelően szerepel a válaszban
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("username", "testuser");
      expect(response.body).toHaveProperty("role", "user");
    });

    it('should return 404 when user is not found', async () => {
      // Beállítjuk, hogy a User.findByPk ne találjon felhasználót
      User.findByPk.mockResolvedValue(null);

      // HTTP GET kérés küldése nem létező felhasználói azonosítóval
      const response = await request(app).get("/users/999");
      
      // Ellenőrizzük a nem található felhasználó hibaválaszát
      expect(response.status).toBe(404); // 404 - Not Found
      expect(response.body).toHaveProperty('message', 'Felhasználó nem található!');
    });
    
    it('should return 500 when error', async () => {
      // Beállítjuk, hogy a User.findByPk hibát dobjon
      User.findByPk.mockRejectedValue(new Error('Database error'));

      // HTTP GET kérés küldése
      const response = await request(app).get("/users/1");
      
      // Ellenőrizzük a szerveroldali hiba kezelését
      expect(response.status).toBe(500); // 500 - Szerver oldali hiba
      expect(response.body).toHaveProperty('message', 'Hiba történt a felhasználó lekérdezésekor.');
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /:id', () => {
    it('should update user data successfully', async () => {
      // Mock felhasználó létrehozása teljes körű frissítési teszthez
      const mockUser = {
        id: 1,
        username: 'oldusername',
        password: 'oldhashed',
        role: 'user',
        // A save metódus mockolása a mentés teszteléséhez
        save: jest.fn().mockResolvedValue(true)
      };
      
      // Beállítjuk, hogy a User.findByPk találja meg a felhasználót
      User.findByPk.mockResolvedValue(mockUser);
      // Beállítjuk, hogy a jelszó hashelés egy új értéket adjon vissza
      bcrypt.hash.mockResolvedValue('newhashed');
      
      // HTTP PUT kérés küldése minden mező frissítésével
      const response = await request(app)
        .put('/users/1')
        .send({
          username: 'newusername',
          password: 'newpassword',
          role: 'admin'
        });
      
      // Ellenőrizzük a sikeres frissítés válaszát
      expect(response.status).toBe(200); // 200 - OK
      // Ellenőrizzük, hogy minden mező megfelelően frissült
      expect(mockUser.username).toBe('newusername');
      expect(mockUser.password).toBe('newhashed');
      expect(mockUser.role).toBe('admin');
      // Ellenőrizzük, hogy a save metódus meghívásra került
      expect(mockUser.save).toHaveBeenCalled();
      // Ellenőrizzük, hogy a jelszó hashelés megfelelően történt
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });
    
    it('should update only provided fields', async () => {
      // Mock felhasználó létrehozása részleges frissítési teszthez
      const mockUser = {
        id: 1,
        username: 'username',
        password: 'hashed',
        role: 'user',
        // A save metódus mockolása a mentés teszteléséhez
        save: jest.fn().mockResolvedValue(true)
      };
      
      // Beállítjuk, hogy a User.findByPk találja meg a felhasználót
      User.findByPk.mockResolvedValue(mockUser);
      
      // HTTP PUT kérés küldése csak a felhasználónév frissítésével
      const response = await request(app)
        .put('/users/1')
        .send({
          username: 'newusername'
          // Jelszó és szerepkör nincs megadva
        });
      
      // Ellenőrizzük a sikeres részleges frissítés válaszát
      expect(response.status).toBe(200); // 200 - OK
      // Ellenőrizzük, hogy csak a megadott mező frissült
      expect(mockUser.username).toBe('newusername');
      // Ellenőrizzük, hogy a nem megadott mezők változatlanok maradtak
      expect(mockUser.password).toBe('hashed'); // Változatlan maradt
      expect(mockUser.role).toBe('user'); // Változatlan maradt
      // Ellenőrizzük, hogy a save metódus meghívásra került
      expect(mockUser.save).toHaveBeenCalled();
      // Ellenőrizzük, hogy a jelszó hashelés nem történt meg, mert nem volt jelszófrissítés
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
    
    it('should return 404 when user to update is not found', async () => {
      // Beállítjuk, hogy a User.findByPk ne találjon felhasználót
      User.findByPk.mockResolvedValue(null);
      
      // HTTP PUT kérés küldése nem létező felhasználói azonosítóval
      const response = await request(app)
        .put('/users/999')
        .send({
          username: 'newusername'
        });
      
      // Ellenőrizzük a nem található felhasználó hibaválaszát
      expect(response.status).toBe(404); // 404 - Not Found
      expect(response.body).toHaveProperty('message', 'Felhasználó nem található!');
    });
    
    it('should return 500 when user update fails', async () => {
      // Beállítjuk, hogy a User.findByPk hibát dobjon
      User.findByPk.mockRejectedValue(new Error('Database error'));
      
      // HTTP PUT kérés küldése
      const response = await request(app)
        .put('/users/1')
        .send({
          username: 'newusername'
        });
      
      // Ellenőrizzük a szerveroldali hiba kezelését
      expect(response.status).toBe(500); // 500 - Szerver oldali hiba
      expect(response.body).toHaveProperty('message', 'Hiba történt a felhasználó frissítésekor.');
      expect(response.body).toHaveProperty('error');
    });
  });
});