package com.edms.service;

import com.edms.dto.*;
import com.edms.entity.*;
import com.edms.exception.ResourceNotFoundException;
import com.edms.repository.DocumentRepository;
import com.edms.repository.ManualTaskActivityRepository;
import com.edms.repository.ManualTaskRepository;
import com.edms.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ManualTaskService {

    private static final Logger log = LoggerFactory.getLogger(ManualTaskService.class);

    private final ManualTaskRepository manualTaskRepository;
    private final ManualTaskActivityRepository manualTaskActivityRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public ManualTaskService(ManualTaskRepository manualTaskRepository,
                             ManualTaskActivityRepository manualTaskActivityRepository,
                             UserRepository userRepository,
                             DocumentRepository documentRepository,
                             NotificationService notificationService,
                             AuditService auditService) {
        this.manualTaskRepository = manualTaskRepository;
        this.manualTaskActivityRepository = manualTaskActivityRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ManualTaskResponse> getTasks(String currentUsername, boolean isAdmin,
                                            String status, String priority, String assignee,
                                            String search, Boolean overdueOnly,
                                            int page, int size, String sortBy, String sortDirection) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortProperty = (sortBy != null && !sortBy.isBlank()) ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(direction, sortProperty));

        Specification<ManualTask> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // RBAC scope
            if (!isAdmin) {
                predicates.add(cb.or(
                        cb.equal(root.get("assignee"), currentUsername),
                        cb.equal(root.get("createdBy"), currentUsername)
                ));
            }

            // Assignee filter
            if (assignee != null && !assignee.isBlank() && !"ALL".equalsIgnoreCase(assignee)) {
                predicates.add(cb.equal(root.get("assignee"), assignee.trim()));
            }

            // Status filter
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                try {
                    ManualTaskStatus taskStatus = ManualTaskStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), taskStatus));
                } catch (IllegalArgumentException ignored) {
                }
            }

            // Priority filter
            if (priority != null && !priority.isBlank() && !"ALL".equalsIgnoreCase(priority)) {
                try {
                    ManualTaskPriority taskPriority = ManualTaskPriority.valueOf(priority.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("priority"), taskPriority));
                } catch (IllegalArgumentException ignored) {
                }
            }

            // Overdue filter
            if (Boolean.TRUE.equals(overdueOnly)) {
                predicates.add(cb.and(
                        cb.isNotNull(root.get("dueDate")),
                        cb.lessThan(root.get("dueDate"), Instant.now()),
                        cb.not(root.get("status").in(ManualTaskStatus.DONE, ManualTaskStatus.CANCELLED))
                ));
            }

            // Search keyword
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descPredicate = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern);
                Predicate docTitlePredicate = cb.like(cb.lower(cb.coalesce(root.get("documentTitle"), "")), pattern);
                Predicate notesPredicate = cb.like(cb.lower(cb.coalesce(root.get("notes"), "")), pattern);

                // If search is numeric, match task ID or document ID
                try {
                    Long numericVal = Long.parseLong(search.trim());
                    Predicate idPredicate = cb.equal(root.get("id"), numericVal);
                    Predicate docIdPredicate = cb.equal(root.get("documentId"), numericVal);
                    predicates.add(cb.or(titlePredicate, descPredicate, docTitlePredicate, notesPredicate, idPredicate, docIdPredicate));
                } catch (NumberFormatException e) {
                    predicates.add(cb.or(titlePredicate, descPredicate, docTitlePredicate, notesPredicate));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ManualTask> tasksPage = manualTaskRepository.findAll(spec, pageable);
        Map<String, User> userCache = getUserCache();

        return tasksPage.map(task -> mapToResponse(task, userCache, false));
    }

    @Transactional(readOnly = true)
    public ManualTaskSummaryDto getSummary(String currentUsername, boolean isAdmin) {
        Instant now = Instant.now();
        if (isAdmin) {
            long total = manualTaskRepository.count();
            long todo = manualTaskRepository.countByStatus(ManualTaskStatus.TODO);
            long inProgress = manualTaskRepository.countByStatus(ManualTaskStatus.IN_PROGRESS);
            long done = manualTaskRepository.countByStatus(ManualTaskStatus.DONE);
            long cancelled = manualTaskRepository.countByStatus(ManualTaskStatus.CANCELLED);
            long overdue = manualTaskRepository.countOverdueTasks(now);
            return new ManualTaskSummaryDto(total, todo, inProgress, done, cancelled, overdue);
        } else {
            long total = manualTaskRepository.countByAssigneeOrCreatedBy(currentUsername, currentUsername);
            long todo = countForUser(currentUsername, ManualTaskStatus.TODO);
            long inProgress = countForUser(currentUsername, ManualTaskStatus.IN_PROGRESS);
            long done = countForUser(currentUsername, ManualTaskStatus.DONE);
            long cancelled = countForUser(currentUsername, ManualTaskStatus.CANCELLED);
            long overdue = manualTaskRepository.countOverdueTasksForUser(currentUsername, now);
            return new ManualTaskSummaryDto(total, todo, inProgress, done, cancelled, overdue);
        }
    }

    private long countForUser(String username, ManualTaskStatus status) {
        Specification<ManualTask> spec = (root, query, cb) -> cb.and(
                cb.or(cb.equal(root.get("assignee"), username), cb.equal(root.get("createdBy"), username)),
                cb.equal(root.get("status"), status)
        );
        return manualTaskRepository.count(spec);
    }

    @Transactional(readOnly = true)
    public ManualTaskResponse getTaskById(Long id, String currentUsername, boolean isAdmin) {
        ManualTask task = manualTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với mã ID: " + id));

        if (!isAdmin && !currentUsername.equals(task.getAssignee()) && !currentUsername.equals(task.getCreatedBy())) {
            throw new AccessDeniedException("Bạn không có quyền xem công việc này.");
        }

        Map<String, User> userCache = getUserCache();
        return mapToResponse(task, userCache, true);
    }

    @Transactional
    public ManualTaskResponse createTask(ManualTaskCreateRequest request, String currentUsername, boolean isAdmin, String ipAddress) {
        // Validate assignee
        String assignee = request.getAssignee() != null ? request.getAssignee().trim() : null;
        if (assignee != null && !assignee.isBlank()) {
            if (!userRepository.existsByUsername(assignee)) {
                throw new IllegalArgumentException("Người phụ trách không tồn tại trong hệ thống: " + assignee);
            }
        }

        // Resolve document title if documentId is provided
        String docTitle = null;
        if (request.getDocumentId() != null) {
            Optional<Document> docOpt = documentRepository.findById(request.getDocumentId());
            if (docOpt.isPresent()) {
                docTitle = docOpt.get().getTitle();
            }
        }

        ManualTask task = new ManualTask(
                request.getTitle().trim(),
                request.getDescription(),
                assignee,
                currentUsername,
                request.getPriority() != null ? request.getPriority() : ManualTaskPriority.MEDIUM,
                request.getDueDate(),
                request.getDocumentId(),
                docTitle,
                request.getNotes()
        );

        ManualTask saved = manualTaskRepository.save(task);

        // Record creation activity
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String creatorFullName = currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : currentUsername;
        manualTaskActivityRepository.save(new ManualTaskActivity(
                saved.getId(),
                currentUsername,
                creatorFullName,
                "CREATED",
                null,
                saved.getStatus().name(),
                "Khởi tạo công việc mới"
        ));

        // Audit log
        auditService.log(
                currentUsername,
                "MANUAL_TASK_CREATE",
                "MANUAL_TASK",
                String.valueOf(saved.getId()),
                "Tạo công việc: " + saved.getTitle() + " (Người nhận: " + saved.getAssignee() + ")",
                ipAddress
        );

        // Notify assignee if different from creator
        if (assignee != null && !assignee.equals(currentUsername)) {
            try {
                notificationService.publishNotification(
                        assignee,
                        NotificationType.TASK_ASSIGNED,
                        "Công việc mới được giao",
                        "Bạn được giao công việc: " + saved.getTitle(),
                        saved.getDocumentId(),
                        null,
                        "MANUAL_TASK",
                        saved.getId(),
                        "OPEN_TASK_CENTER",
                        "TASK_ASSIGN_" + saved.getId() + "_" + Instant.now().toEpochMilli()
                );
            } catch (Exception e) {
                log.warn("Failed to publish task assignment notification: {}", e.getMessage());
            }
        }

        Map<String, User> userCache = getUserCache();
        return mapToResponse(saved, userCache, true);
    }

    @Transactional
    public ManualTaskResponse updateTask(Long id, ManualTaskUpdateRequest request, String currentUsername, boolean isAdmin, String ipAddress) {
        ManualTask task = manualTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với mã ID: " + id));

        boolean isCreator = currentUsername.equals(task.getCreatedBy());
        boolean isAssignee = currentUsername.equals(task.getAssignee());

        if (!isAdmin && !isCreator && !isAssignee) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa công việc này.");
        }

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String userFullName = currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : currentUsername;

        // If non-admin and only assignee (not creator), they can only update status and notes
        if (!isAdmin && !isCreator && isAssignee) {
            if (request.getStatus() != null && request.getStatus() != task.getStatus()) {
                String oldStatus = task.getStatus().name();
                task.setStatus(request.getStatus());
                manualTaskActivityRepository.save(new ManualTaskActivity(
                        task.getId(), currentUsername, userFullName, "STATUS_CHANGED", oldStatus, task.getStatus().name(), request.getNotes()
                ));
            }
            if (request.getNotes() != null) {
                task.setNotes(request.getNotes());
            }
            task.setUpdatedAt(Instant.now());
            ManualTask saved = manualTaskRepository.save(task);

            auditService.log(currentUsername, "MANUAL_TASK_UPDATE", "MANUAL_TASK", String.valueOf(saved.getId()),
                    "Cập nhật trạng thái/ghi chú: " + saved.getStatus(), ipAddress);

            Map<String, User> userCache = getUserCache();
            return mapToResponse(saved, userCache, true);
        }

        // Full update by Admin or Creator
        String oldAssignee = task.getAssignee();
        ManualTaskStatus oldStatus = task.getStatus();
        ManualTaskPriority oldPriority = task.getPriority();

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());

        if (request.getAssignee() != null && !request.getAssignee().isBlank()) {
            if (!userRepository.existsByUsername(request.getAssignee().trim())) {
                throw new IllegalArgumentException("Người phụ trách không tồn tại: " + request.getAssignee());
            }
            task.setAssignee(request.getAssignee().trim());
        }

        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        task.setDueDate(request.getDueDate());

        if (request.getDocumentId() != null) {
            task.setDocumentId(request.getDocumentId());
            documentRepository.findById(request.getDocumentId()).ifPresent(d -> task.setDocumentTitle(d.getTitle()));
        } else {
            task.setDocumentId(null);
            task.setDocumentTitle(null);
        }

        if (request.getNotes() != null) {
            task.setNotes(request.getNotes());
        }
        task.setUpdatedAt(Instant.now());

        ManualTask saved = manualTaskRepository.save(task);

        // Record activities for notable changes
        if (oldStatus != saved.getStatus()) {
            manualTaskActivityRepository.save(new ManualTaskActivity(
                    saved.getId(), currentUsername, userFullName, "STATUS_CHANGED",
                    oldStatus != null ? oldStatus.name() : "NONE", saved.getStatus().name(), "Đổi trạng thái"
            ));
        }
        if (!Objects.equals(oldAssignee, saved.getAssignee())) {
            manualTaskActivityRepository.save(new ManualTaskActivity(
                    saved.getId(), currentUsername, userFullName, "ASSIGNED",
                    oldAssignee, saved.getAssignee(), "Chuyển giao người phụ trách"
            ));
            // Notify new assignee
            if (saved.getAssignee() != null && !saved.getAssignee().equals(currentUsername)) {
                try {
                    notificationService.publishNotification(
                            saved.getAssignee(), NotificationType.TASK_ASSIGNED,
                            "Công việc được phân công lại",
                            "Bạn được giao phụ trách công việc: " + saved.getTitle(),
                            saved.getDocumentId(), null, "MANUAL_TASK", saved.getId(),
                            "OPEN_TASK_CENTER", "TASK_REASSIGN_" + saved.getId() + "_" + Instant.now().toEpochMilli()
                    );
                } catch (Exception ignored) {
                }
            }
        }
        if (oldPriority != saved.getPriority()) {
            manualTaskActivityRepository.save(new ManualTaskActivity(
                    saved.getId(), currentUsername, userFullName, "PRIORITY_CHANGED",
                    oldPriority != null ? oldPriority.name() : "NONE", saved.getPriority().name(), "Đổi mức ưu tiên"
            ));
        }

        auditService.log(currentUsername, "MANUAL_TASK_UPDATE", "MANUAL_TASK", String.valueOf(saved.getId()),
                "Cập nhật công việc: " + saved.getTitle(), ipAddress);

        Map<String, User> userCache = getUserCache();
        return mapToResponse(saved, userCache, true);
    }

    @Transactional
    public ManualTaskResponse updateStatus(Long id, ManualTaskStatusUpdateRequest request, String currentUsername, boolean isAdmin, String ipAddress) {
        ManualTask task = manualTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với mã ID: " + id));

        boolean isCreator = currentUsername.equals(task.getCreatedBy());
        boolean isAssignee = currentUsername.equals(task.getAssignee());

        if (!isAdmin && !isCreator && !isAssignee) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật trạng thái công việc này.");
        }

        ManualTaskStatus oldStatus = task.getStatus();
        task.setStatus(request.getStatus());
        if (request.getNote() != null && !request.getNote().isBlank()) {
            task.setNotes(request.getNote());
        }
        task.setUpdatedAt(Instant.now());

        ManualTask saved = manualTaskRepository.save(task);

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String userFullName = currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : currentUsername;

        manualTaskActivityRepository.save(new ManualTaskActivity(
                saved.getId(), currentUsername, userFullName, "STATUS_CHANGED",
                oldStatus != null ? oldStatus.name() : "NONE", saved.getStatus().name(), request.getNote()
        ));

        auditService.log(currentUsername, "MANUAL_TASK_STATUS_UPDATE", "MANUAL_TASK", String.valueOf(saved.getId()),
                "Chuyển trạng thái sang: " + saved.getStatus(), ipAddress);

        // Notify creator if updated by assignee, or notify assignee if updated by creator/admin
        String targetUser = isAssignee ? saved.getCreatedBy() : saved.getAssignee();
        if (targetUser != null && !targetUser.equals(currentUsername)) {
            try {
                notificationService.publishNotification(
                        targetUser,
                        NotificationType.TASK_STATUS_UPDATED,
                        "Cập nhật trạng thái công việc",
                        "Công việc \"" + saved.getTitle() + "\" đã chuyển sang: " + saved.getStatus().name(),
                        saved.getDocumentId(),
                        null,
                        "MANUAL_TASK",
                        saved.getId(),
                        "OPEN_TASK_CENTER",
                        "TASK_STATUS_" + saved.getId() + "_" + Instant.now().toEpochMilli()
                );
            } catch (Exception ignored) {
            }
        }

        Map<String, User> userCache = getUserCache();
        return mapToResponse(saved, userCache, true);
    }

    @Transactional
    public void deleteTask(Long id, String currentUsername, boolean isAdmin, String ipAddress) {
        ManualTask task = manualTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với mã ID: " + id));

        if (!isAdmin && !currentUsername.equals(task.getCreatedBy())) {
            throw new AccessDeniedException("Chỉ người tạo hoặc Quản trị viên mới có quyền xóa công việc này.");
        }

        manualTaskActivityRepository.deleteByTaskId(id);
        manualTaskRepository.delete(task);

        auditService.log(currentUsername, "MANUAL_TASK_DELETE", "MANUAL_TASK", String.valueOf(id),
                "Xóa công việc: " + task.getTitle(), ipAddress);
    }

    @Transactional(readOnly = true)
    public List<AssigneeOptionDto> getAssigneeOptions() {
        return userRepository.findAll().stream()
                .filter(User::isEnabled)
                .map(u -> new AssigneeOptionDto(
                        u.getUsername(),
                        u.getFullName() != null ? u.getFullName() : u.getUsername(),
                        u.getEmail(),
                        u.getRole() != null ? u.getRole().name() : "ROLE_USER"
                ))
                .sorted(Comparator.comparing(AssigneeOptionDto::getFullName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    @Transactional
    public ManualTaskResponse addComment(Long id, ManualTaskCommentRequest request, String currentUsername, boolean isAdmin, String ipAddress) {
        ManualTask task = manualTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với mã ID: " + id));

        boolean isCreator = currentUsername.equals(task.getCreatedBy());
        boolean isAssignee = currentUsername.equals(task.getAssignee());

        if (!isAdmin && !isCreator && !isAssignee) {
            throw new AccessDeniedException("Bạn không có quyền bình luận trên công việc này.");
        }

        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String userFullName = currentUser != null && currentUser.getFullName() != null ? currentUser.getFullName() : currentUsername;

        manualTaskActivityRepository.save(new ManualTaskActivity(
                task.getId(), currentUsername, userFullName, "COMMENT_ADDED",
                null, null, request.getComment()
        ));

        task.setUpdatedAt(Instant.now());
        manualTaskRepository.save(task);

        auditService.log(currentUsername, "MANUAL_TASK_COMMENT", "MANUAL_TASK", String.valueOf(task.getId()),
                "Thêm bình luận cho công việc #" + task.getId(), ipAddress);

        // Notify counterpart
        String targetUser = isAssignee ? task.getCreatedBy() : task.getAssignee();
        if (targetUser != null && !targetUser.equals(currentUsername)) {
            try {
                notificationService.publishNotification(
                        targetUser,
                        NotificationType.TASK_COMMENT_ADDED,
                        "Bình luận mới trên công việc #" + task.getId(),
                        userFullName + " đã bình luận: \"" + truncate(request.getComment(), 80) + "\"",
                        task.getDocumentId(),
                        null,
                        "MANUAL_TASK",
                        task.getId(),
                        "OPEN_TASK_CENTER",
                        "TASK_COMMENT_" + task.getId() + "_" + Instant.now().toEpochMilli()
                );
            } catch (Exception ignored) {
            }
        }

        Map<String, User> userCache = getUserCache();
        return mapToResponse(task, userCache, true);
    }

    @Transactional(readOnly = true)
    public List<ManualTaskWorkloadDto> getWorkload(String currentUsername, boolean isAdmin) {
        List<User> users = userRepository.findAll().stream()
                .filter(User::isEnabled)
                .toList();

        if (!isAdmin) {
            users = users.stream()
                    .filter(u -> u.getUsername().equals(currentUsername))
                    .toList();
        }

        List<ManualTask> allActiveTasks = manualTaskRepository.findAll();
        Instant now = Instant.now();

        List<ManualTaskWorkloadDto> result = new ArrayList<>();
        for (User u : users) {
            String uname = u.getUsername();
            List<ManualTask> userTasks = allActiveTasks.stream()
                    .filter(t -> uname.equals(t.getAssignee()))
                    .toList();

            long total = userTasks.size();
            long todo = userTasks.stream().filter(t -> t.getStatus() == ManualTaskStatus.TODO).count();
            long inProgress = userTasks.stream().filter(t -> t.getStatus() == ManualTaskStatus.IN_PROGRESS).count();
            long done = userTasks.stream().filter(t -> t.getStatus() == ManualTaskStatus.DONE).count();
            long overdue = userTasks.stream().filter(t ->
                    t.getDueDate() != null &&
                    t.getDueDate().isBefore(now) &&
                    t.getStatus() != ManualTaskStatus.DONE &&
                    t.getStatus() != ManualTaskStatus.CANCELLED
            ).count();

            result.add(new ManualTaskWorkloadDto(
                    uname,
                    u.getFullName() != null ? u.getFullName() : uname,
                    total, todo, inProgress, done, overdue
            ));
        }

        return result;
    }

    @Transactional
    public EscalationResultDto checkEscalation(String currentUsername, boolean isAdmin, String ipAddress) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ Quản trị viên mới có quyền kích hoạt kiểm tra và gửi cảnh báo nhắc hạn.");
        }

        Instant now = Instant.now();
        Instant soonThreshold = now.plus(24, ChronoUnit.HOURS);
        LocalDate today = LocalDate.now();

        List<ManualTask> tasks = manualTaskRepository.findAll().stream()
                .filter(t -> t.getDueDate() != null)
                .filter(t -> t.getStatus() == ManualTaskStatus.TODO || t.getStatus() == ManualTaskStatus.IN_PROGRESS)
                .toList();

        int remindedCount = 0;
        int overdueCount = 0;

        for (ManualTask t : tasks) {
            boolean isOverdue = t.getDueDate().isBefore(now);
            boolean isDueSoon = !isOverdue && t.getDueDate().isBefore(soonThreshold);

            if (isOverdue || isDueSoon) {
                if (isOverdue) overdueCount++;
                String dedupKey = "REMIND_" + t.getId() + "_" + today;
                String title = isOverdue ? "Cảnh báo: Công việc quá hạn #" + t.getId() : "Nhắc nhở: Công việc sắp đến hạn #" + t.getId();
                String content = (isOverdue ? "Công việc đã quá hạn xử lý: " : "Công việc sắp hết hạn xử lý (trong 24h): ") + t.getTitle();

                if (t.getAssignee() != null) {
                    try {
                        notificationService.publishNotification(
                                t.getAssignee(),
                                NotificationType.TASK_DEADLINE_REMINDER,
                                title,
                                content,
                                t.getDocumentId(),
                                null,
                                "MANUAL_TASK",
                                t.getId(),
                                "OPEN_TASK_CENTER",
                                dedupKey
                        );
                        remindedCount++;
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        auditService.log(currentUsername, "MANUAL_TASK_ESCALATION_CHECK", "MANUAL_TASK", "SYSTEM",
                "Kiểm tra cảnh báo nhắc hạn: " + remindedCount + " lời nhắc, " + overdueCount + " việc quá hạn", ipAddress);

        return new EscalationResultDto(remindedCount, overdueCount,
                "Đã kiểm tra và gửi " + remindedCount + " thông báo nhắc hạn thành công (" + overdueCount + " công việc quá hạn).");
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen - 3) + "...";
    }

    private Map<String, User> getUserCache() {
        return userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getUsername, u -> u, (a, b) -> a));
    }

    private ManualTaskResponse mapToResponse(ManualTask task, Map<String, User> userCache, boolean includeActivities) {
        ManualTaskResponse res = new ManualTaskResponse();
        res.setId(task.getId());
        res.setTitle(task.getTitle());
        res.setDescription(task.getDescription());
        res.setAssignee(task.getAssignee());

        if (task.getAssignee() != null && userCache.containsKey(task.getAssignee())) {
            User aUser = userCache.get(task.getAssignee());
            res.setAssigneeFullName(aUser.getFullName() != null ? aUser.getFullName() : aUser.getUsername());
            res.setAssigneeRole(aUser.getRole() != null ? aUser.getRole().name() : null);
        }

        res.setCreatedBy(task.getCreatedBy());
        if (task.getCreatedBy() != null && userCache.containsKey(task.getCreatedBy())) {
            User cUser = userCache.get(task.getCreatedBy());
            res.setCreatedByFullName(cUser.getFullName() != null ? cUser.getFullName() : cUser.getUsername());
            res.setCreatedByRole(cUser.getRole() != null ? cUser.getRole().name() : null);
        }

        res.setPriority(task.getPriority());
        res.setStatus(task.getStatus());
        res.setDueDate(task.getDueDate());
        res.setOverdue(task.isOverdue());
        res.setDocumentId(task.getDocumentId());
        res.setDocumentTitle(task.getDocumentTitle());
        res.setNotes(task.getNotes());
        res.setCreatedAt(task.getCreatedAt());
        res.setUpdatedAt(task.getUpdatedAt());
        res.setCompletedAt(task.getCompletedAt());

        if (includeActivities) {
            List<ManualTaskActivity> activities = manualTaskActivityRepository.findByTaskIdOrderByCreatedAtDesc(task.getId());
            res.setActivities(activities.stream()
                    .map(act -> new ManualTaskActivityResponse(
                            act.getId(),
                            act.getTaskId(),
                            act.getUsername(),
                            act.getUserFullName(),
                            act.getAction(),
                            act.getOldValue(),
                            act.getNewValue(),
                            act.getComment(),
                            act.getCreatedAt()
                    ))
                    .collect(Collectors.toList()));
        }

        return res;
    }
}
