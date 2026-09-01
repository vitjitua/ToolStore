using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly EquipmentStoreContext _context;

    public ProjectsController(EquipmentStoreContext context)
    {
        _context = context;
    }

    // ============================================================
    // ACTIVE PROJECTS
    // Used by Tool Transactions
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var projects = await _context.Projects
            .AsNoTracking()
            .Where(p => p.Status == "Active")
            .OrderBy(p => p.ProjectName)
            .ToListAsync();

        return Ok(projects);
    }


    // ============================================================
    // ALL PROJECTS
    // Used by Administration
    // ============================================================

    [HttpGet("all")]
    public async Task<IActionResult> GetAllProjects()
    {
        var projects = await _context.Projects
            .AsNoTracking()
            .OrderBy(p => p.ProjectNumber)
            .ToListAsync();

        return Ok(projects);
    }


    // ============================================================
    // CREATE PROJECT
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateProject(
        [FromBody] CreateProjectRequest request
    )
    {
        var projectNumber = request.ProjectNumber?.Trim();
        var projectName = request.ProjectName?.Trim();

        if (string.IsNullOrWhiteSpace(projectNumber))
        {
            return BadRequest("Project number is required.");
        }

        if (string.IsNullOrWhiteSpace(projectName))
        {
            return BadRequest("Project name is required.");
        }

        var projectNumberExists = await _context.Projects
            .AnyAsync(p =>
                p.ProjectNumber.ToLower() ==
                projectNumber.ToLower()
            );

        if (projectNumberExists)
        {
            return BadRequest(
                $"A project with project number '{projectNumber}' already exists."
            );
        }

        if (
    request.StartDate.HasValue &&
    request.EndDate.HasValue &&
    request.EndDate < request.StartDate
)
{
    return BadRequest(
        "End date cannot be earlier than start date."
    );
}

var project = new Project
{
    ProjectNumber = projectNumber,
    ProjectName = projectName,
    Status = "Active",
    StartDate = request.StartDate,
    EndDate = request.EndDate
};

        _context.Projects.Add(project);

        await _context.SaveChangesAsync();

        return Ok(project);
    }


    // ============================================================
    // UPDATE PROJECT
    // ============================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProject(
        int id,
        [FromBody] UpdateProjectRequest request
    )
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(
                p => p.ProjectId == id
            );

        if (project == null)
        {
            return NotFound("Project not found.");
        }

        var projectNumber = request.ProjectNumber?.Trim();
        var projectName = request.ProjectName?.Trim();

        if (string.IsNullOrWhiteSpace(projectNumber))
        {
            return BadRequest("Project number is required.");
        }

        if (string.IsNullOrWhiteSpace(projectName))
        {
            return BadRequest("Project name is required.");
        }

        var duplicateNumber = await _context.Projects
            .AnyAsync(p =>
                p.ProjectId != id &&
                p.ProjectNumber.ToLower() ==
                projectNumber.ToLower()
            );

        if (duplicateNumber)
        {
            return BadRequest(
                $"A project with project number '{projectNumber}' already exists."
            );
        }

        if (
    request.StartDate.HasValue &&
    request.EndDate.HasValue &&
    request.EndDate < request.StartDate
)
{
    return BadRequest(
        "End date cannot be earlier than start date."
    );
}

        project.ProjectNumber = projectNumber;
        project.ProjectName = projectName;
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;

        await _context.SaveChangesAsync();

        return Ok(project);
    }


    // ============================================================
    // CHANGE PROJECT STATUS
    // ============================================================

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateProjectStatus(
        int id,
        [FromBody] UpdateProjectStatusRequest request
    )
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(
                p => p.ProjectId == id
            );

        if (project == null)
        {
            return NotFound("Project not found.");
        }

        if (
            request.Status != "Active" &&
            request.Status != "Closed"
        )
        {
            return BadRequest(
                "Project status must be either 'Active' or 'Closed'."
            );
        }

        project.Status = request.Status;

        await _context.SaveChangesAsync();

        return Ok(project);
    }
}


// ============================================================
// REQUEST MODELS
// ============================================================

public class CreateProjectRequest
{
    public string ProjectNumber { get; set; } = string.Empty;

    public string ProjectName { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class UpdateProjectRequest
{
    public string ProjectNumber { get; set; } = string.Empty;

    public string ProjectName { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class UpdateProjectStatusRequest
{
    public string Status { get; set; } = string.Empty;
}