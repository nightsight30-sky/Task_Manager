package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskDto;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.User;
import com.example.taskmanager.repository.TaskRepository;
import com.example.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private TaskDto convertToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPriority(task.getPriority());
        dto.setStatus(task.getStatus());
        dto.setDueDate(task.getDueDate());

        if (task.getOwner() != null) {
            dto.setOwnerUsername(task.getOwner().getUsername());
        }

        List<String> collabNames = task.getCollaborators()
                .stream()
                .map(User::getUsername)
                .collect(Collectors.toList());

        dto.setCollaborators(collabNames);

        return dto;
    }

    @Override
    public List<TaskDto> getAllTasksForUser(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        Set<Task> allTasks = new HashSet<>();
        allTasks.addAll(taskRepository.findByOwner(user));
        allTasks.addAll(taskRepository.findByCollaboratorsContaining(user));

        return allTasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public TaskDto getTaskByIdForUser(Long taskId, String username) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        if (!task.getOwner().getUsername().equals(username) &&
                task.getCollaborators().stream().noneMatch(u -> u.getUsername().equals(username))) {
            throw new RuntimeException("Unauthorized");
        }
        return convertToDto(task);
    }

    @Override
    @Transactional
    public TaskDto createTask(Task task, String username) {
        User owner = userRepository.findByUsername(username).orElseThrow();
        task.setOwner(owner);
        task.setStatus("PENDING"); // default if missing
        Task saved = taskRepository.save(task);
        return convertToDto(saved);
    }

    @Override
    public TaskDto updateTask(Long taskId, Task updatedTask, String username) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        if (!task.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setPriority(updatedTask.getPriority());
        task.setStatus(updatedTask.getStatus());
        task.setDueDate(updatedTask.getDueDate());

        return convertToDto(taskRepository.save(task));
    }

    @Override
    public void deleteTask(Long taskId, String username) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        if (!task.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }
        taskRepository.delete(task);
    }

    @Override
    public TaskDto addCollaborator(Long taskId, String collaboratorUsername, String ownerUsername) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        if (!task.getOwner().getUsername().equals(ownerUsername)) {
            throw new RuntimeException("Unauthorized");
        }

        User collab = userRepository.findByUsername(collaboratorUsername).orElseThrow();
        task.getCollaborators().add(collab);
        return convertToDto(taskRepository.save(task));
    }
}
