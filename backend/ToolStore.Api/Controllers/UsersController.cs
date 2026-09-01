using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly EquipmentStoreContext _context;

    private static readonly string[] AllowedRoles =
    {
        "Storeman",
        "Manager",
        "Admin"
    };

    public UsersController(EquipmentStoreContext context)
    {
        _context = context;
    }

    // ============================================================
    // ACTIVE USERS
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .OrderBy(u => u.DisplayName)
            .Select(u => new
            {
                u.UserId,
                u.EmployeeNumber,
                u.DisplayName,
                u.EmailAddress,
                u.Role,
                u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }


    // ============================================================
    // ALL USERS
    // Used by Administration
    // ============================================================

    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.DisplayName)
            .Select(u => new
            {
                u.UserId,
                u.EmployeeNumber,
                u.DisplayName,
                u.EmailAddress,
                u.Role,
                u.IsActive,
                u.CreatedDate
            })
            .ToListAsync();

        return Ok(users);
    }


    // ============================================================
    // CREATE USER
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request
    )
    {
        var employeeNumber = request.EmployeeNumber?.Trim();
        var displayName = request.DisplayName?.Trim();
        var emailAddress = request.EmailAddress?.Trim();
        var role = NormaliseRole(request.Role);

        if (string.IsNullOrWhiteSpace(employeeNumber))
        {
            return BadRequest("Staff number is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return BadRequest("Display name is required.");
        }

        if (string.IsNullOrWhiteSpace(emailAddress))
        {
            return BadRequest("Email address is required.");
        }

        if (role == null)
        {
            return BadRequest(
                "Role must be Storeman, Manager or Admin."
            );
        }

        var duplicateEmployeeNumber = await _context.Users
            .AnyAsync(u =>
                u.EmployeeNumber != null &&
                u.EmployeeNumber.ToLower() ==
                employeeNumber.ToLower()
            );

        if (duplicateEmployeeNumber)
        {
            return BadRequest(
                $"A user with staff number '{employeeNumber}' already exists."
            );
        }

        var duplicateEmail = await _context.Users
            .AnyAsync(u =>
                u.EmailAddress.ToLower() ==
                emailAddress.ToLower()
            );

        if (duplicateEmail)
        {
            return BadRequest(
                $"A user with email address '{emailAddress}' already exists."
            );
        }

        var user = new User
        {
            EmployeeNumber = employeeNumber,
            DisplayName = displayName,
            EmailAddress = emailAddress,
            Role = role,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.UserId,
            user.EmployeeNumber,
            user.DisplayName,
            user.EmailAddress,
            user.Role,
            user.IsActive,
            user.CreatedDate
        });
    }


    // ============================================================
    // UPDATE USER
    // ============================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(
        int id,
        [FromBody] UpdateUserRequest request
    )
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null)
        {
            return NotFound("User not found.");
        }

        var employeeNumber = request.EmployeeNumber?.Trim();
        var displayName = request.DisplayName?.Trim();
        var emailAddress = request.EmailAddress?.Trim();
        var role = NormaliseRole(request.Role);

        if (string.IsNullOrWhiteSpace(employeeNumber))
        {
            return BadRequest("Staff number is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return BadRequest("Display name is required.");
        }

        if (string.IsNullOrWhiteSpace(emailAddress))
        {
            return BadRequest("Email address is required.");
        }

        if (role == null)
        {
            return BadRequest(
                "Role must be Storeman, Manager or Admin."
            );
        }

        var duplicateEmployeeNumber = await _context.Users
            .AnyAsync(u =>
                u.UserId != id &&
                u.EmployeeNumber != null &&
                u.EmployeeNumber.ToLower() ==
                employeeNumber.ToLower()
            );

        if (duplicateEmployeeNumber)
        {
            return BadRequest(
                $"A user with staff number '{employeeNumber}' already exists."
            );
        }

        var duplicateEmail = await _context.Users
            .AnyAsync(u =>
                u.UserId != id &&
                u.EmailAddress.ToLower() ==
                emailAddress.ToLower()
            );

        if (duplicateEmail)
        {
            return BadRequest(
                $"A user with email address '{emailAddress}' already exists."
            );
        }

        user.EmployeeNumber = employeeNumber;
        user.DisplayName = displayName;
        user.EmailAddress = emailAddress;
        user.Role = role;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.UserId,
            user.EmployeeNumber,
            user.DisplayName,
            user.EmailAddress,
            user.Role,
            user.IsActive,
            user.CreatedDate
        });
    }


    // ============================================================
    // ACTIVATE / DEACTIVATE USER
    // ============================================================

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetUserActive(
        int id,
        [FromBody] SetUserActiveRequest request
    )
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null)
        {
            return NotFound("User not found.");
        }

        user.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.UserId,
            user.EmployeeNumber,
            user.DisplayName,
            user.EmailAddress,
            user.Role,
            user.IsActive,
            user.CreatedDate
        });
    }


    // ============================================================
    // ROLE VALIDATION
    // ============================================================

    private static string? NormaliseRole(string? requestedRole)
    {
        if (string.IsNullOrWhiteSpace(requestedRole))
        {
            return null;
        }

        var role = AllowedRoles.FirstOrDefault(
            allowedRole =>
                allowedRole.Equals(
                    requestedRole.Trim(),
                    StringComparison.OrdinalIgnoreCase
                )
        );

        return role;
    }
}


// ============================================================
// REQUEST MODELS
// ============================================================

public class CreateUserRequest
{
    public string EmployeeNumber { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string EmailAddress { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string EmployeeNumber { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string EmailAddress { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}

public class SetUserActiveRequest
{
    public bool IsActive { get; set; }
}