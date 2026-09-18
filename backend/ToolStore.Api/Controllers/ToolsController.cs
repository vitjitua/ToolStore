using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolsController : ControllerBase
{
    private readonly EquipmentStoreContext _context;

    public ToolsController(EquipmentStoreContext context)
    {
        _context = context;
    }

    // ============================================================
    // ALL TOOLS
    // Used by Tool Register and Tool Transactions
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetTools()
    {
        var tools = await _context.Tools
            .AsNoTracking()
            .OrderBy(t => t.AssetNumber)
            .Select(t => new
            {
                t.ToolId,
                t.AssetNumber,
                t.ToolName,
                t.Category,
                t.SerialNumber,
                t.StoreLocation,
                t.Condition,
                t.Status,
                t.IsActive,
                t.CreatedDate,
                t.CreatedBy
            })
            .ToListAsync();

        return Ok(tools);
    }


    // ============================================================
    // CREATE TOOL
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateTool(
        [FromBody] CreateToolRequest request
    )
    {
        var assetNumber = request.AssetNumber?.Trim();
        var toolName = request.ToolName?.Trim();
        var category = request.Category?.Trim();
        var serialNumber = request.SerialNumber?.Trim();
        var storeLocation = request.StoreLocation?.Trim();
        var conditionName = request.Condition?.Trim();
        var statusName = request.Status?.Trim();
        var createdBy = request.CreatedBy?.Trim();

        if (string.IsNullOrWhiteSpace(assetNumber))
        {
            return BadRequest("Asset number is required.");
        }

        if (string.IsNullOrWhiteSpace(toolName))
        {
            return BadRequest("Tool name is required.");
        }

        if (string.IsNullOrWhiteSpace(conditionName))
        {
            return BadRequest("Condition is required.");
        }

        if (string.IsNullOrWhiteSpace(statusName))
        {
            return BadRequest("Status is required.");
        }

        var duplicateAssetNumber = await _context.Tools
            .AnyAsync(t =>
                t.AssetNumber.ToLower() ==
                assetNumber.ToLower()
            );

        if (duplicateAssetNumber)
        {
            return BadRequest(
                $"A tool with asset number '{assetNumber}' already exists."
            );
        }

        var condition = await _context.ToolConditions
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.ConditionName.ToLower() ==
                conditionName.ToLower() &&
                c.IsActive
            );

        if (condition == null)
        {
            return BadRequest(
                $"The condition '{conditionName}' is not configured or is inactive."
            );
        }

        var status = await _context.ToolStatuses
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.StatusName.ToLower() ==
                statusName.ToLower() &&
                s.IsActive
            );

        if (status == null)
        {
            return BadRequest(
                $"The status '{statusName}' is not configured or is inactive."
            );
        }

        var tool = new Tool
        {
            AssetNumber = assetNumber,
            ToolName = toolName,
            Category = string.IsNullOrWhiteSpace(category)
                ? null
                : category,
            SerialNumber = string.IsNullOrWhiteSpace(serialNumber)
                ? null
                : serialNumber,
            StoreLocation = string.IsNullOrWhiteSpace(storeLocation)
                ? null
                : storeLocation,
            Condition = condition.ConditionName,
            Status = status.StatusName,
            IsActive = true,
            CreatedDate = DateTime.Now,
            CreatedBy = string.IsNullOrWhiteSpace(createdBy)
                ? null
                : createdBy
        };

        _context.Tools.Add(tool);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            tool.ToolId,
            tool.AssetNumber,
            tool.ToolName,
            tool.Category,
            tool.SerialNumber,
            tool.StoreLocation,
            tool.Condition,
            tool.Status,
            tool.IsActive,
            tool.CreatedDate,
            tool.CreatedBy
        });
    }


    // ============================================================
    // UPDATE TOOL
    // ============================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTool(
        int id,
        [FromBody] UpdateToolRequest request
    )
    {
        var tool = await _context.Tools
            .FirstOrDefaultAsync(t => t.ToolId == id);

        if (tool == null)
        {
            return NotFound("Tool not found.");
        }

        var assetNumber = request.AssetNumber?.Trim();
        var toolName = request.ToolName?.Trim();
        var category = request.Category?.Trim();
        var serialNumber = request.SerialNumber?.Trim();
        var storeLocation = request.StoreLocation?.Trim();
        var conditionName = request.Condition?.Trim();
        var statusName = request.Status?.Trim();

        if (string.IsNullOrWhiteSpace(assetNumber))
        {
            return BadRequest("Asset number is required.");
        }

        if (string.IsNullOrWhiteSpace(toolName))
        {
            return BadRequest("Tool name is required.");
        }

        if (string.IsNullOrWhiteSpace(conditionName))
        {
            return BadRequest("Condition is required.");
        }

        if (string.IsNullOrWhiteSpace(statusName))
        {
            return BadRequest("Status is required.");
        }

        var duplicateAssetNumber = await _context.Tools
            .AnyAsync(t =>
                t.ToolId != id &&
                t.AssetNumber.ToLower() ==
                assetNumber.ToLower()
            );

        if (duplicateAssetNumber)
        {
            return BadRequest(
                $"A tool with asset number '{assetNumber}' already exists."
            );
        }

        var condition = await _context.ToolConditions
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.ConditionName.ToLower() ==
                conditionName.ToLower() &&
                c.IsActive
            );

        if (condition == null)
        {
            return BadRequest(
                $"The condition '{conditionName}' is not configured or is inactive."
            );
        }

        var status = await _context.ToolStatuses
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.StatusName.ToLower() ==
                statusName.ToLower() &&
                s.IsActive
            );

        if (status == null)
        {
            return BadRequest(
                $"The status '{statusName}' is not configured or is inactive."
            );
        }

        // Do not allow operational state changes while the tool
        // currently has an open allocation.
        var hasOpenTransaction = await _context.ToolTransactions
            .AnyAsync(t =>
                t.ToolId == id &&
                t.TransactionStatus == "Open"
            );

        if (hasOpenTransaction)
        {
            var conditionChanged =
                !string.Equals(
                    tool.Condition,
                    condition.ConditionName,
                    StringComparison.OrdinalIgnoreCase
                );

            var statusChanged =
                !string.Equals(
                    tool.Status,
                    status.StatusName,
                    StringComparison.OrdinalIgnoreCase
                );

            if (conditionChanged || statusChanged)
            {
                return BadRequest(
                    "Condition or status cannot be changed while the tool is currently booked out."
                );
            }
        }

        tool.AssetNumber = assetNumber;
        tool.ToolName = toolName;
        tool.Category = string.IsNullOrWhiteSpace(category)
            ? null
            : category;
        tool.SerialNumber = string.IsNullOrWhiteSpace(serialNumber)
            ? null
            : serialNumber;
        tool.StoreLocation = string.IsNullOrWhiteSpace(storeLocation)
            ? null
            : storeLocation;
        tool.Condition = condition.ConditionName;
        tool.Status = status.StatusName;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            tool.ToolId,
            tool.AssetNumber,
            tool.ToolName,
            tool.Category,
            tool.SerialNumber,
            tool.StoreLocation,
            tool.Condition,
            tool.Status,
            tool.IsActive,
            tool.CreatedDate,
            tool.CreatedBy
        });
    }


    // ============================================================
    // ACTIVATE / DEACTIVATE TOOL
    // ============================================================

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetToolActive(
        int id,
        [FromBody] SetToolActiveRequest request
    )
    {
        var tool = await _context.Tools
            .FirstOrDefaultAsync(t => t.ToolId == id);

        if (tool == null)
        {
            return NotFound("Tool not found.");
        }

        if (!request.IsActive)
        {
            var hasOpenTransaction = await _context.ToolTransactions
                .AnyAsync(t =>
                    t.ToolId == id &&
                    t.TransactionStatus == "Open"
                );

            if (hasOpenTransaction)
            {
                return BadRequest(
                    $"The tool '{tool.AssetNumber} - {tool.ToolName}' is currently booked out and cannot be deactivated."
                );
            }
        }

        tool.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            tool.ToolId,
            tool.AssetNumber,
            tool.ToolName,
            tool.Category,
            tool.SerialNumber,
            tool.StoreLocation,
            tool.Condition,
            tool.Status,
            tool.IsActive,
            tool.CreatedDate,
            tool.CreatedBy
        });
    }

    // ============================================================
    // IMPORT TOOLS
    // New imported tools always start as Good / Available / Active
    // ============================================================

    [HttpPost("import")]
    public async Task<IActionResult> ImportTools(
        [FromBody] ImportToolsRequest request
    )
    {
        if (request.Tools == null || request.Tools.Count == 0)
        {
            return BadRequest("No tools were supplied for import.");
        }

        var defaultCondition = await _context.ToolConditions
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.ConditionName.ToLower() == "good" &&
                c.IsActive
            );

        if (defaultCondition == null)
        {
            return BadRequest(
                "Tool import cannot continue because the active condition 'Good' is not configured. Please configure or activate 'Good' in Administration."
            );
        }

        var defaultStatus = await _context.ToolStatuses
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.StatusName.ToLower() == "available" &&
                s.IsActive
            );

        if (defaultStatus == null)
        {
            return BadRequest(
                "Tool import cannot continue because the active status 'Available' is not configured. Please configure or activate 'Available' in Administration."
            );
        }

        var existingAssetNumbers = await _context.Tools
            .AsNoTracking()
            .Select(t => t.AssetNumber)
            .ToListAsync();

        var existingAssets = new HashSet<string>(
            existingAssetNumbers.Select(a => a.Trim().ToLower())
        );

        var importAssets = new HashSet<string>();
        var toolsToAdd = new List<Tool>();
        var errors = new List<object>();

        for (var index = 0; index < request.Tools.Count; index++)
        {
            var row = request.Tools[index];
            var excelRowNumber = index + 2;

            var assetNumber = row.AssetNumber?.Trim();
            var toolName = row.ToolName?.Trim();
            var category = row.Category?.Trim();
            var serialNumber = row.SerialNumber?.Trim();
            var storeLocation = row.StoreLocation?.Trim();

            var rowErrors = new List<string>();

            if (string.IsNullOrWhiteSpace(assetNumber))
            {
                rowErrors.Add("Asset Number is required.");
            }

            if (string.IsNullOrWhiteSpace(toolName))
            {
                rowErrors.Add("Tool Name is required.");
            }

            if (!string.IsNullOrWhiteSpace(assetNumber))
            {
                var assetKey = assetNumber.ToLower();

                if (existingAssets.Contains(assetKey))
                {
                    rowErrors.Add(
                        $"Asset Number '{assetNumber}' already exists."
                    );
                }

                if (!importAssets.Add(assetKey))
                {
                    rowErrors.Add(
                        $"Asset Number '{assetNumber}' appears more than once in the import file."
                    );
                }
            }

            if (rowErrors.Count > 0)
            {
                errors.Add(new
                {
                    RowNumber = excelRowNumber,
                    AssetNumber = assetNumber,
                    ToolName = toolName,
                    Errors = rowErrors
                });

                continue;
            }

            toolsToAdd.Add(new Tool
            {
                AssetNumber = assetNumber!,
                ToolName = toolName!,
                Category = string.IsNullOrWhiteSpace(category)
                    ? null
                    : category,
                SerialNumber = string.IsNullOrWhiteSpace(serialNumber)
                    ? null
                    : serialNumber,
                StoreLocation = string.IsNullOrWhiteSpace(storeLocation)
                    ? null
                    : storeLocation,
                Condition = defaultCondition.ConditionName,
                Status = defaultStatus.StatusName,
                IsActive = true,
                CreatedDate = DateTime.Now,
                CreatedBy = string.IsNullOrWhiteSpace(request.CreatedBy)
                    ? null
                    : request.CreatedBy.Trim()
            });
        }

        if (toolsToAdd.Count > 0)
        {
            _context.Tools.AddRange(toolsToAdd);
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            totalRows = request.Tools.Count,
            importedCount = toolsToAdd.Count,
            rejectedCount = errors.Count,
            errors
        });
    }
}



// ============================================================
// REQUEST MODELS
// ============================================================

public class CreateToolRequest
{
    public string AssetNumber { get; set; } = string.Empty;

    public string ToolName { get; set; } = string.Empty;

    public string? Category { get; set; }

    public string? SerialNumber { get; set; }

    public string? StoreLocation { get; set; }

    public string Condition { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? CreatedBy { get; set; }
}

public class UpdateToolRequest
{
    public string AssetNumber { get; set; } = string.Empty;

    public string ToolName { get; set; } = string.Empty;

    public string? Category { get; set; }

    public string? SerialNumber { get; set; }

    public string? StoreLocation { get; set; }

    public string Condition { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
}

public class SetToolActiveRequest
{
    public bool IsActive { get; set; }
}

public class ImportToolsRequest
{
    public List<ImportToolRowRequest> Tools { get; set; } = new();

    public string? CreatedBy { get; set; }
}

public class ImportToolRowRequest
{
    public string AssetNumber { get; set; } = string.Empty;

    public string ToolName { get; set; } = string.Empty;

    public string? Category { get; set; }

    public string? SerialNumber { get; set; }

    public string? StoreLocation { get; set; }
}
