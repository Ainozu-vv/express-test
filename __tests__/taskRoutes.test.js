const request = require("supertest");
const express = require("express");
const router = require("../routes/taskRoutes");
const Task = require("../models/task");
const {checkUserTaskOwnership} = require("../middlewares/taskOwnership")
const {checkTaskNotCompleted} = require("../middlewares/taskStatus")

//függőségeket izolálni kell!
jest.mock("../models/task")
jest.mock("../middlewares/taskOwnership",()=>({
    checkUserTaskOwnership: jest.fn((req, res, next) => next()),
}))
jest.mock("../middlewares/taskStatus",()=>({
    checkTaskNotCompleted: jest.fn((req, res, next) => next()),
}))
//alap express app
const app=express()
app.use(express.json())

//felhasználó beállítása a get /tasks-hoz
app.use((req,res,next)=>{
    req.user={id:1}
    next()
})

app.use("/tasks",router)

describe("Task routes",()=>{
    beforeEach(()=>{
        jest.clearAllMocks()
    })

    describe("POST /tasks",()=>{
        it("should create a new task", async ()=>{
            const mockTask={
                id:1,
                title:"Test Task",
                description:"Test Description",
                UserId:1,
            }
            Task.create.mockResolvedValue(mockTask)

            const response=await request(app).post("/tasks").send({
                title:"Test Task",
                description:"Test Description",
                UserId:1
            })

            expect(response.status).toBe(201)
            expect(response.body).toEqual(mockTask)

        })

        it("should return 500 when creation fails",async()=>{
            Task.create.mockRejectedValue(new Error("Database error"))

            const response = await request(app).post("/tasks").send({
                title:"Test Task",
                description:"Test Description",
                UserId:1
            })

            expect(response.status).toBe(500)
            expect(response.body).toHaveProperty("error")
        })
    })

    describe("GET /tasks",()=>{
        it("should return task for the current user",async()=>{
            const mockTasks=[
                {id:1,title: "Task 1",description:"Desc 1", userId:1},
                {id:2,title: "Task 2",description:"Desc 2", userId:1}
            ]
            Task.findAll.mockResolvedValue(mockTasks)

            const response = await request(app).get("/tasks")

            expect(response.status).toBe(200)
            expect(response.body).toEqual(mockTasks)
            expect(Task.findAll).toHaveBeenCalledWith({
                where:{userId:1}
            })
        })

        it("should return 500 when fails",async ()=>{
            Task.findAll.mockRejectedValue(new Error("Database error"))

            const response = await request(app).get("/tasks")

            expect(response.status).toBe(500)
            expect(response.body).toHaveProperty("error")
        })
    })

    describe("GET /tasks/:taskId",()=>{
        it("should return a single task",async ()=>{
            const mockTask={
                id:1,
                title:"Task 1",
                description:"Desc 1",
                userId:1
            }
            Task.findByPk.mockResolvedValue(mockTask)

            const response = await request(app).get("/tasks/1").send({
                userId:1
            })

            expect(response.status).toBe(200)
            expect(response.body).toEqual(mockTask)
            expect(Task.findByPk).toHaveBeenCalledWith("1")
            expect(checkUserTaskOwnership).toHaveBeenCalled()
        })
        it("should return 500 when fails",async()=>{
            Task.findByPk.mockRejectedValue(new Error("Database error"))

            const response = await request(app).get("/tasks/1").send({userId:1})

            expect(response.status).toBe(500)
            expect(response.body).toHaveProperty("error")

        })
    })
  describe("PUT /tasks/:taskId",()=>{
        it("should update the task",async()=>{
            const mockTask={
            id:1,
            title:"Old Title",
            description:"Old Description",
            status:"in progress",
            save: jest.fn().mockResolvedValue(true)
        }
        Task.findByPk.mockResolvedValue(mockTask)

        const response=await request(app).put("/tasks/1").send({
            title:"New Title",
            description:"New Description",
            status:"completed",
            UserId:1
        })

        expect(response.status).toBe(200)
        expect(mockTask.title).toBe("New Title")
        expect(mockTask.description).toBe("New Description")
        expect(mockTask.status).toBe("completed")
        
        expect(mockTask.save).toHaveBeenCalled()
        expect(checkUserTaskOwnership).toHaveBeenCalled()
        expect(checkTaskNotCompleted).toHaveBeenCalled()
        })
        it("should return 500",async ()=>{
            Task.findByPk.mockRejectedValue(new Error("Database error"))

            const response = await request(app).put("/tasks/1").send({
                title:"New Title",
                description:"New Description",
                status:"completed",
                UserId:1
            })

            expect(response.status).toBe(500)
            expect(response.body).toHaveProperty("error")
        })
    })

    describe("DELETE /tasks/:taskId",()=>{
        it("should delete the task",async ()=>{
            const mockTask={
                id:1,
                destroy: jest.fn().mockResolvedValue(true)
            }
            Task.findByPk.mockResolvedValue(mockTask)

            const response=await request(app).delete("/tasks/1").send({
                userId:1
            })

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty(
                "message",
                "A feladat sikeresen törölve lett."
            )
            expect(mockTask.destroy).toHaveBeenCalled()
            expect(checkUserTaskOwnership).toHaveBeenCalled()
            expect(checkTaskNotCompleted).toHaveBeenCalled()
        })
        it("should return 500 when fails",async()=>{
            Task.findByPk.mockRejectedValue(new Error("Database error"))

            const response = await request(app).delete("/tasks/1").send({
                userId:1
            })

            expect(response.status).toBe(500)
            expect(response.body).toHaveProperty("error")
        })
    })
  
})