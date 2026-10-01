using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly EquipmentStoreContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthController(
        EquipmentStoreContext context,
        IPasswordHasher<User> passwordHasher
    )
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    // ============================================================
    // LOGIN
    // ============================================================

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var emailAddress = request.EmailAddress?.Trim();

        if (string.IsNullOrWhiteSpace(emailAddress))
        {
            return BadRequest("Email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Password is required.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.EmailAddress.ToLower() == emailAddress.ToLower()
            );

        // Use the same response for an unknown account, inactive account,
        // missing password hash, or incorrect password.
        if (
            user == null ||
            !user.IsActive ||
            string.IsNullOrWhiteSpace(user.PasswordHash)
        )
        {
            return Unauthorized("Invalid email address or password.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.Password
        );

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Invalid email address or password.");
        }

        if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                request.Password
            );

            await _context.SaveChangesAsync();
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Email, user.EmailAddress),
            new(ClaimTypes.Role, user.Role),
            new("EmployeeNumber", user.EmployeeNumber ?? string.Empty)
        };

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = false,
                AllowRefresh = true
            }
        );

        return Ok(ToUserResponse(user));
    }

    // ============================================================
    // CURRENT LOGGED-IN USER
    // ============================================================

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive);

        if (user == null)
        {
            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme
            );

            return Unauthorized();
        }

        return Ok(ToUserResponse(user));
    }

    // ============================================================
    // LOGOUT
    // ============================================================

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        return Ok(new
        {
            message = "Logged out successfully."
        });
    }

    private static object ToUserResponse(User user)
    {
        return new
        {
            user.UserId,
            user.EmployeeNumber,
            user.DisplayName,
            user.EmailAddress,
            user.Role,
            user.IsActive
        };
    }
}

public class LoginRequest
{
    public string EmailAddress { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
