using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtisansController : ControllerBase
{
    private readonly EquipmentStoreContext _context;

    public ArtisansController(EquipmentStoreContext context)
    {
        _context = context;
    }

    // ============================================================
    // ACTIVE ARTISANS
    // Used by Tool Transactions
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetArtisans()
    {
        var artisans = await _context.Artisans
            .AsNoTracking()
            .Where(a => a.IsActive)
            .OrderBy(a => a.FullName)
            .Select(a => new
            {
                a.ArtisanId,
                a.EmployeeNumber,
                a.FullName,
                a.Department,
                a.Trade,
                a.IsActive
            })
            .ToListAsync();

        return Ok(artisans);
    }


    // ============================================================
    // ALL ARTISANS
    // Used by Administration
    // ============================================================

    [HttpGet("all")]
    public async Task<IActionResult> GetAllArtisans()
    {
        var artisans = await _context.Artisans
            .AsNoTracking()
            .OrderBy(a => a.EmployeeNumber)
            .Select(a => new
            {
                a.ArtisanId,
                a.EmployeeNumber,
                a.FullName,
                a.Department,
                a.Trade,
                a.IsActive,
                a.CreatedDate
            })
            .ToListAsync();

        return Ok(artisans);
    }


    // ============================================================
    // CREATE ARTISAN
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateArtisan(
        [FromBody] CreateArtisanRequest request
    )
    {
        var employeeNumber = request.EmployeeNumber?.Trim();
        var fullName = request.FullName?.Trim();
        var department = request.Department?.Trim();
        var trade = request.Trade?.Trim();

        if (string.IsNullOrWhiteSpace(employeeNumber))
        {
            return BadRequest("Staff number is required.");
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(department))
        {
            return BadRequest("Department is required.");
        }

        if (string.IsNullOrWhiteSpace(trade))
        {
            return BadRequest("Trade is required.");
        }

        // Staff Number / Employee Number must be unique
        var employeeNumberExists = await _context.Artisans
            .AnyAsync(a =>
                a.EmployeeNumber.ToLower() ==
                employeeNumber.ToLower()
            );

        if (employeeNumberExists)
        {
            return BadRequest(
                $"An artisan with staff number '{employeeNumber}' already exists."
            );
        }

        var artisan = new Artisan
        {
            EmployeeNumber = employeeNumber,
            FullName = fullName,
            Department = department,
            Trade = trade,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

        _context.Artisans.Add(artisan);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            artisan.ArtisanId,
            artisan.EmployeeNumber,
            artisan.FullName,
            artisan.Department,
            artisan.Trade,
            artisan.IsActive,
            artisan.CreatedDate
        });
    }


    // ============================================================
    // UPDATE ARTISAN
    // ============================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateArtisan(
        int id,
        [FromBody] UpdateArtisanRequest request
    )
    {
        var artisan = await _context.Artisans
            .FirstOrDefaultAsync(a => a.ArtisanId == id);

        if (artisan == null)
        {
            return NotFound("Artisan not found.");
        }

        var employeeNumber = request.EmployeeNumber?.Trim();
        var fullName = request.FullName?.Trim();
        var department = request.Department?.Trim();
        var trade = request.Trade?.Trim();

        if (string.IsNullOrWhiteSpace(employeeNumber))
        {
            return BadRequest("Staff number is required.");
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(department))
        {
            return BadRequest("Department is required.");
        }

        if (string.IsNullOrWhiteSpace(trade))
        {
            return BadRequest("Trade is required.");
        }

        var duplicateEmployeeNumber = await _context.Artisans
            .AnyAsync(a =>
                a.ArtisanId != id &&
                a.EmployeeNumber.ToLower() ==
                employeeNumber.ToLower()
            );

        if (duplicateEmployeeNumber)
        {
            return BadRequest(
                $"An artisan with staff number '{employeeNumber}' already exists."
            );
        }

        artisan.EmployeeNumber = employeeNumber;
        artisan.FullName = fullName;
        artisan.Department = department;
        artisan.Trade = trade;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            artisan.ArtisanId,
            artisan.EmployeeNumber,
            artisan.FullName,
            artisan.Department,
            artisan.Trade,
            artisan.IsActive,
            artisan.CreatedDate
        });
    }


    // ============================================================
    // ACTIVATE / DEACTIVATE ARTISAN
    // ============================================================

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetArtisanActive(
        int id,
        [FromBody] SetArtisanActiveRequest request
    )
    {
        var artisan = await _context.Artisans
            .FirstOrDefaultAsync(a => a.ArtisanId == id);

        if (artisan == null)
        {
            return NotFound("Artisan not found.");
        }

        // An artisan with an open tool allocation should not
        // be deactivated until the tool has been returned.
        if (!request.IsActive)
        {
            var hasOpenAllocation =
                await _context.ToolTransactions
                    .AnyAsync(t =>
                        t.ArtisanId == id &&
                        t.ReturnedDate == null
                    );

            if (hasOpenAllocation)
            {
                return BadRequest(
                    $"{artisan.FullName} currently has one or more tools booked out and cannot be deactivated."
                );
            }
        }

        artisan.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            artisan.ArtisanId,
            artisan.EmployeeNumber,
            artisan.FullName,
            artisan.Department,
            artisan.Trade,
            artisan.IsActive,
            artisan.CreatedDate
        });
    }
}


// ============================================================
// REQUEST MODELS
// ============================================================

public class CreateArtisanRequest
{
    public string EmployeeNumber { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Trade { get; set; } = string.Empty;
}

public class UpdateArtisanRequest
{
    public string EmployeeNumber { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Trade { get; set; } = string.Empty;
}

public class SetArtisanActiveRequest
{
    public bool IsActive { get; set; }
}