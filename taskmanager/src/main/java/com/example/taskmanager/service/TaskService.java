package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskDto;
import com.example.taskmanager.model.Task;

import java.util.List;

public interface TaskService {
    List<TaskDto> getAllTasksForUser(String username);

    TaskDto getTaskByIdForUser(Long taskId, String username);

    TaskDto createTask(Task task, String username);

    TaskDto updateTask(Long taskId, Task updatedTask, String username);

    void deleteTask(Long taskId, String username);

    TaskDto addCollaborator(Long taskId, String collaboratorUsername, String ownerUsername);
}
