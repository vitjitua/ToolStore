using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MasterDataController : ControllerBase
{
    private readonly EquipmentStoreContext _context;

    public MasterDataController(EquipmentStoreContext context)
    {
        _context = context;
    }

    // ============================================================
    // TOOL STATUSES
    // ============================================================

    // Used by normal application pages.
    // Only returns ACTIVE statuses.
    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses()
    {
        var statuses = await _context.ToolStatuses
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.StatusName)
            .Select(s => new
            {
                s.StatusId,
                s.StatusName,
                s.CanBookOut
            })
            .ToListAsync();

        return Ok(statuses);
    }


    // ============================================================
    // ALL TOOL STATUSES
    // Used by Administration
    // ============================================================

    [HttpGet("statuses/all")]
    public async Task<IActionResult> GetAllStatuses()
    {
        var statuses = await _context.ToolStatuses
            .AsNoTracking()
            .OrderBy(s => s.StatusName)
            .Select(s => new
            {
                s.StatusId,
                s.StatusName,
                s.CanBookOut,
                s.IsActive,
                s.CreatedDate
            })
            .ToListAsync();

        return Ok(statuses);
    }


    // ============================================================
    // CREATE TOOL STATUS
    // ============================================================

    [HttpPost("statuses")]
    public async Task<IActionResult> CreateStatus(
        [FromBody] CreateToolStatusRequest request
    )
    {
        var statusName = request.StatusName?.Trim();

        if (string.IsNullOrWhiteSpace(statusName))
        {
            return BadRequest("Status name is required.");
        }

        var exists = await _context.ToolStatuses
            .AnyAsync(s =>
                s.StatusName.ToLower() ==
                statusName.ToLower()
            );

        if (exists)
        {
            return BadRequest(
                $"A status named '{statusName}' already exists."
            );
        }

        var status = new ToolStatus
        {
            StatusName = statusName,
            CanBookOut = request.CanBookOut,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

        _context.ToolStatuses.Add(status);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            status.StatusId,
            status.StatusName,
            status.CanBookOut,
            status.IsActive,
            status.CreatedDate
        });
    }


    // ============================================================
    // UPDATE TOOL STATUS
    // ============================================================

    [HttpPut("statuses/{id:int}")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateToolStatusRequest request
    )
    {
        var status = await _context.ToolStatuses
            .FirstOrDefaultAsync(s => s.StatusId == id);

        if (status == null)
        {
            return NotFound("Tool status not found.");
        }

        var statusName = request.StatusName?.Trim();

        if (string.IsNullOrWhiteSpace(statusName))
        {
            return BadRequest("Status name is required.");
        }

        var duplicateExists = await _context.ToolStatuses
            .AnyAsync(s =>
                s.StatusId != id &&
                s.StatusName.ToLower() ==
                statusName.ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(
                $"A status named '{statusName}' already exists."
            );
        }

        // Tools currently store Status as text.
        // Prevent renaming a status that is currently assigned.
        if (!string.Equals(
                status.StatusName,
                statusName,
                StringComparison.OrdinalIgnoreCase
            ))
        {
            var statusInUse = await _context.Tools
                .AnyAsync(t =>
                    t.Status == status.StatusName
                );

            if (statusInUse)
            {
                return BadRequest(
                    $"The status '{status.StatusName}' is currently assigned to one or more tools and cannot be renamed."
                );
            }
        }

        status.StatusName = statusName;
        status.CanBookOut = request.CanBookOut;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            status.StatusId,
            status.StatusName,
            status.CanBookOut,
            status.IsActive,
            status.CreatedDate
        });
    }


    // ============================================================
    // ACTIVATE / DEACTIVATE TOOL STATUS
    // ============================================================

    [HttpPatch("statuses/{id:int}/active")]
    public async Task<IActionResult> SetStatusActive(
        int id,
        [FromBody] SetActiveRequest request
    )
    {
        var status = await _context.ToolStatuses
            .FirstOrDefaultAsync(s => s.StatusId == id);

        if (status == null)
        {
            return NotFound("Tool status not found.");
        }

        if (!request.IsActive)
        {
            // Protect statuses currently assigned to tools.
            var statusInUse = await _context.Tools
                .AnyAsync(t =>
                    t.Status == status.StatusName
                );

            if (statusInUse)
            {
                return BadRequest(
                    $"The status '{status.StatusName}' is currently assigned to one or more tools and cannot be deactivated."
                );
            }

            // Protect statuses mapped to Tool Conditions.
            var mappedToCondition =
                await _context.ToolConditions
                    .AnyAsync(c =>
                        c.ResultingStatusId == id &&
                        c.IsActive
                    );

            if (mappedToCondition)
            {
                return BadRequest(
                    $"The status '{status.StatusName}' is mapped to one or more active tool conditions and cannot be deactivated."
                );
            }
        }

        status.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            status.StatusId,
            status.StatusName,
            status.CanBookOut,
            status.IsActive,
            status.CreatedDate
        });
    }


    // ============================================================
    // TOOL CONDITIONS
    // ============================================================

    // Used by Tool Transactions.
    // Only returns active conditions.
    [HttpGet("conditions")]
    public async Task<IActionResult> GetConditions()
    {
        var conditions = await _context.ToolConditions
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.ConditionName)
            .Select(c => new
            {
                c.ConditionId,
                c.ConditionName,
                c.AllowedOnIssue,
                c.AllowedOnReturn,
                c.ResultingStatusId,
                ResultingStatusName =
                    c.ResultingStatus != null
                        ? c.ResultingStatus.StatusName
                        : null
            })
            .ToListAsync();

        return Ok(conditions);
    }


    // ============================================================
    // ALL TOOL CONDITIONS
    // Used by Administration
    // ============================================================

    [HttpGet("conditions/all")]
    public async Task<IActionResult> GetAllConditions()
    {
        var conditions = await _context.ToolConditions
            .AsNoTracking()
            .OrderBy(c => c.ConditionName)
            .Select(c => new
            {
                c.ConditionId,
                c.ConditionName,
                c.AllowedOnIssue,
                c.AllowedOnReturn,
                c.ResultingStatusId,
                ResultingStatusName =
                    c.ResultingStatus != null
                        ? c.ResultingStatus.StatusName
                        : null,
                c.IsActive,
                c.CreatedDate
            })
            .ToListAsync();

        return Ok(conditions);
    }


    // ============================================================
    // CREATE TOOL CONDITION
    // ============================================================

    [HttpPost("conditions")]
    public async Task<IActionResult> CreateCondition(
        [FromBody] CreateToolConditionRequest request
    )
    {
        var conditionName =
            request.ConditionName?.Trim();

        if (string.IsNullOrWhiteSpace(conditionName))
        {
            return BadRequest(
                "Condition name is required."
            );
        }

        if (
            !request.AllowedOnIssue &&
            !request.AllowedOnReturn
        )
        {
            return BadRequest(
                "The condition must be allowed on issue, return, or both."
            );
        }

        // Any condition that can be used on Return
        // must tell the system what status to apply.
        if (
            request.AllowedOnReturn &&
            request.ResultingStatusId == null
        )
        {
            return BadRequest(
                "A resulting tool status is required for a condition allowed on return."
            );
        }

        var duplicateExists =
            await _context.ToolConditions
                .AnyAsync(c =>
                    c.ConditionName.ToLower() ==
                    conditionName.ToLower()
                );

        if (duplicateExists)
        {
            return BadRequest(
                $"A condition named '{conditionName}' already exists."
            );
        }

        if (request.ResultingStatusId.HasValue)
        {
            var resultingStatus =
                await _context.ToolStatuses
                    .FirstOrDefaultAsync(s =>
                        s.StatusId ==
                        request.ResultingStatusId.Value
                    );

            if (resultingStatus == null)
            {
                return BadRequest(
                    "The selected resulting tool status does not exist."
                );
            }

            if (!resultingStatus.IsActive)
            {
                return BadRequest(
                    $"The resulting status '{resultingStatus.StatusName}' is inactive."
                );
            }
        }

        var condition = new ToolCondition
        {
            ConditionName = conditionName,
            AllowedOnIssue = request.AllowedOnIssue,
            AllowedOnReturn = request.AllowedOnReturn,
            ResultingStatusId =
                request.ResultingStatusId,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

        _context.ToolConditions.Add(condition);

        await _context.SaveChangesAsync();

        return await GetConditionResult(
            condition.ConditionId
        );
    }


    // ============================================================
    // UPDATE TOOL CONDITION
    // ============================================================

    [HttpPut("conditions/{id:int}")]
    public async Task<IActionResult> UpdateCondition(
        int id,
        [FromBody] UpdateToolConditionRequest request
    )
    {
        var condition =
            await _context.ToolConditions
                .FirstOrDefaultAsync(c =>
                    c.ConditionId == id
                );

        if (condition == null)
        {
            return NotFound(
                "Tool condition not found."
            );
        }

        var conditionName =
            request.ConditionName?.Trim();

        if (string.IsNullOrWhiteSpace(conditionName))
        {
            return BadRequest(
                "Condition name is required."
            );
        }

        if (
            !request.AllowedOnIssue &&
            !request.AllowedOnReturn
        )
        {
            return BadRequest(
                "The condition must be allowed on issue, return, or both."
            );
        }

        if (
            request.AllowedOnReturn &&
            request.ResultingStatusId == null
        )
        {
            return BadRequest(
                "A resulting tool status is required for a condition allowed on return."
            );
        }

        var duplicateExists =
            await _context.ToolConditions
                .AnyAsync(c =>
                    c.ConditionId != id &&
                    c.ConditionName.ToLower() ==
                    conditionName.ToLower()
                );

        if (duplicateExists)
        {
            return BadRequest(
                $"A condition named '{conditionName}' already exists."
            );
        }

        // Tools currently store Condition as text.
        // Prevent renaming a condition currently assigned to a tool.
        if (!string.Equals(
                condition.ConditionName,
                conditionName,
                StringComparison.OrdinalIgnoreCase
            ))
        {
            var conditionInUse =
                await _context.Tools
                    .AnyAsync(t =>
                        t.Condition ==
                        condition.ConditionName
                    );

            if (conditionInUse)
            {
                return BadRequest(
                    $"The condition '{condition.ConditionName}' is currently assigned to one or more tools and cannot be renamed."
                );
            }
        }

        if (request.ResultingStatusId.HasValue)
        {
            var resultingStatus =
                await _context.ToolStatuses
                    .FirstOrDefaultAsync(s =>
                        s.StatusId ==
                        request.ResultingStatusId.Value
                    );

            if (resultingStatus == null)
            {
                return BadRequest(
                    "The selected resulting tool status does not exist."
                );
            }

            if (!resultingStatus.IsActive)
            {
                return BadRequest(
                    $"The resulting status '{resultingStatus.StatusName}' is inactive."
                );
            }
        }

        condition.ConditionName =
            conditionName;

        condition.AllowedOnIssue =
            request.AllowedOnIssue;

        condition.AllowedOnReturn =
            request.AllowedOnReturn;

        condition.ResultingStatusId =
            request.ResultingStatusId;

        await _context.SaveChangesAsync();

        return await GetConditionResult(id);
    }


    // ============================================================
    // ACTIVATE / DEACTIVATE TOOL CONDITION
    // ============================================================

    [HttpPatch("conditions/{id:int}/active")]
    public async Task<IActionResult> SetConditionActive(
        int id,
        [FromBody] SetActiveRequest request
    )
    {
        var condition =
            await _context.ToolConditions
                .FirstOrDefaultAsync(c =>
                    c.ConditionId == id
                );

        if (condition == null)
        {
            return NotFound(
                "Tool condition not found."
            );
        }

        // When reactivating, make sure its resulting
        // status still exists and is active.
        if (
            request.IsActive &&
            condition.AllowedOnReturn
        )
        {
            if (!condition.ResultingStatusId.HasValue)
            {
                return BadRequest(
                    $"The condition '{condition.ConditionName}' cannot be activated because it does not have a resulting tool status."
                );
            }

            var resultingStatus =
                await _context.ToolStatuses
                    .FirstOrDefaultAsync(s =>
                        s.StatusId ==
                        condition.ResultingStatusId.Value
                    );

            if (
                resultingStatus == null ||
                !resultingStatus.IsActive
            )
            {
                return BadRequest(
                    $"The condition '{condition.ConditionName}' cannot be activated because its resulting tool status is unavailable."
                );
            }
        }

        condition.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return await GetConditionResult(id);
    }


    // ============================================================
    // CONDITION RESPONSE HELPER
    // ============================================================

    private async Task<IActionResult> GetConditionResult(
        int conditionId
    )
    {
        var result =
            await _context.ToolConditions
                .AsNoTracking()
                .Where(c =>
                    c.ConditionId == conditionId
                )
                .Select(c => new
                {
                    c.ConditionId,
                    c.ConditionName,
                    c.AllowedOnIssue,
                    c.AllowedOnReturn,
                    c.ResultingStatusId,
                    ResultingStatusName =
                        c.ResultingStatus != null
                            ? c.ResultingStatus.StatusName
                            : null,
                    c.IsActive,
                    c.CreatedDate
                })
                .FirstAsync();

        return Ok(result);
    }
}


// ============================================================
// REQUEST MODELS
// ============================================================

public class CreateToolStatusRequest
{
    public string StatusName { get; set; } =
        string.Empty;

    public bool CanBookOut { get; set; }
}

public class UpdateToolStatusRequest
{
    public string StatusName { get; set; } =
        string.Empty;

    public bool CanBookOut { get; set; }
}

public class CreateToolConditionRequest
{
    public string ConditionName { get; set; } =
        string.Empty;

    public bool AllowedOnIssue { get; set; }

    public bool AllowedOnReturn { get; set; }

    public int? ResultingStatusId { get; set; }
}

public class UpdateToolConditionRequest
{
    public string ConditionName { get; set; } =
        string.Empty;

    public bool AllowedOnIssue { get; set; }

    public bool AllowedOnReturn { get; set; }

    public int? ResultingStatusId { get; set; }
}

public class SetActiveRequest
{
    public bool IsActive { get; set; }
}