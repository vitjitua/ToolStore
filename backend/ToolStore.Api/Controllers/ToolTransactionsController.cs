using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Data;
using ToolStore.Api.Models;

namespace ToolStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolTransactionsController : ControllerBase
{
    private readonly EquipmentStoreContext _context;

    public ToolTransactionsController(EquipmentStoreContext context)
    {
        _context = context;
    }

    // ============================================================
    // CURRENT TOOL ALLOCATIONS
    // ============================================================

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentAllocations()
    {
        var allocations = await _context.ToolTransactions
            .AsNoTracking()
            .Where(t => t.TransactionStatus == "Open")
            .Include(t => t.Tool)
            .Include(t => t.Artisan)
            .Include(t => t.Project)
            .Include(t => t.IssuedByUser)
            .OrderByDescending(t => t.IssuedDate)
            .Select(t => new
            {
                t.TransactionId,
                t.ToolId,
                t.Tool.AssetNumber,
                t.Tool.ToolName,

                t.ArtisanId,
                ArtisanName = t.Artisan.FullName,

                t.ProjectId,
                ProjectName = t.Project != null
                    ? t.Project.ProjectName
                    : null,

                t.IssuedDate,
                t.ExpectedReturnDate,
                t.IssueCondition,
                t.TransactionStatus,

                IssuedBy = t.IssuedByUser.DisplayName,
                t.Remarks
            })
            .ToListAsync();

        return Ok(allocations);
    }

    // GET: api/tooltransactions/recent
[HttpGet("recent")]
public async Task<IActionResult> GetRecentActivity()
{
    var transactions = await _context.ToolTransactions
        .AsNoTracking()
        .Include(t => t.Tool)
        .Include(t => t.Artisan)
        .Include(t => t.IssuedByUser)
        .Include(t => t.ReturnedByUser)
        .OrderByDescending(t =>
            t.ReturnedDate ?? t.IssuedDate
        )
        .Take(10)
        .Select(t => new
        {
            t.TransactionId,

            t.ToolId,
            t.Tool.AssetNumber,
            t.Tool.ToolName,

            t.ArtisanId,
            ArtisanName = t.Artisan.FullName,

            t.IssuedDate,
            t.ReturnedDate,
            t.TransactionStatus,

            IssuedBy = t.IssuedByUser.DisplayName,

            ReturnedBy = t.ReturnedByUser != null
                ? t.ReturnedByUser.DisplayName
                : null
        })
        .ToListAsync();

    return Ok(transactions);
}


    // ============================================================
    // BOOK OUT TOOL
    // ============================================================

    [HttpPost("bookout")]
    public async Task<IActionResult> BookOutTool(
        [FromBody] BookOutToolRequest request
    )
    {
        var tool = await _context.Tools
            .FirstOrDefaultAsync(t =>
                t.ToolId == request.ToolId
            );

        if (tool == null)
        {
            return NotFound("Tool not found.");
        }

        if (!tool.IsActive)
        {
            return BadRequest(
                "Inactive tools cannot be booked out."
            );
        }


        // ========================================================
        // CHECK CURRENT TOOL STATUS
        // ========================================================

        var currentStatus =
            await _context.ToolStatuses
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.StatusName == tool.Status &&
                    s.IsActive
                );

        if (currentStatus == null)
        {
            return BadRequest(
                $"The tool status '{tool.Status}' is not configured or is inactive."
            );
        }

        if (!currentStatus.CanBookOut)
        {
            return BadRequest(
                $"Tool cannot be booked out because its current status is '{tool.Status}'."
            );
        }


        // ========================================================
        // VALIDATE ISSUE CONDITION
        // ========================================================

        var issueConditionName =
            request.IssueCondition?.Trim();

        if (string.IsNullOrWhiteSpace(issueConditionName))
        {
            return BadRequest(
                "Issue condition is required."
            );
        }

        var issueCondition =
            await _context.ToolConditions
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.ConditionName == issueConditionName &&
                    c.IsActive &&
                    c.AllowedOnIssue
                );

        if (issueCondition == null)
        {
            return BadRequest(
                $"The condition '{issueConditionName}' is not configured for tool issue."
            );
        }


        // ========================================================
        // VALIDATE ARTISAN
        // ========================================================

        var artisan =
            await _context.Artisans
                .FirstOrDefaultAsync(a =>
                    a.ArtisanId ==
                        request.ArtisanId &&
                    a.IsActive
                );

        if (artisan == null)
        {
            return BadRequest(
                "The selected artisan is invalid or inactive."
            );
        }


        // ========================================================
        // VALIDATE PROJECT
        // ========================================================

        if (request.ProjectId.HasValue)
        {
            var projectExists =
                await _context.Projects
                    .AnyAsync(p =>
                        p.ProjectId ==
                            request.ProjectId.Value &&
                        p.Status == "Active"
                    );

            if (!projectExists)
            {
                return BadRequest(
                    "The selected project is invalid or inactive."
                );
            }
        }


        // ========================================================
        // VALIDATE ISSUING USER
        // ========================================================

        var userExists =
            await _context.Users
                .AnyAsync(u =>
                    u.UserId ==
                        request.IssuedByUserId &&
                    u.IsActive
                );

        if (!userExists)
        {
            return BadRequest(
                "The issuing user is invalid or inactive."
            );
        }


        // ========================================================
        // CHECK FOR OPEN TRANSACTION
        // ========================================================

        var openTransactionExists =
            await _context.ToolTransactions
                .AnyAsync(t =>
                    t.ToolId ==
                        request.ToolId &&
                    t.TransactionStatus == "Open"
                );

        if (openTransactionExists)
        {
            return BadRequest(
                "This tool already has an open transaction."
            );
        }


        // ========================================================
        // CREATE TRANSACTION
        // ========================================================

        var transaction =
            new ToolTransaction
            {
                ToolId =
                    request.ToolId,

                ArtisanId =
                    request.ArtisanId,

                ProjectId =
                    request.ProjectId,

                IssuedDate =
                    DateTime.Now,

                ExpectedReturnDate =
                    request.ExpectedReturnDate,

                IssueCondition =
                    issueCondition.ConditionName,

                IssuedByUserId =
                    request.IssuedByUserId,

                TransactionStatus =
                    "Open",

                Remarks =
                    request.Remarks,

                CreatedDate =
                    DateTime.Now
            };

        _context.ToolTransactions.Add(
            transaction
        );


        // Booking a tool creates an open allocation.
        // The transaction controls this status.
        tool.Status = "Booked Out";

        // Keep the tool's actual physical condition
        // aligned with the issue condition.
        tool.Condition =
            issueCondition.ConditionName;


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message =
                "Tool booked out successfully.",

            transactionId =
                transaction.TransactionId,

            toolId =
                tool.ToolId,

            tool =
                tool.ToolName,

            artisan =
                artisan.FullName
        });
    }


    // ============================================================
    // RETURN TOOL
    // ============================================================

    [HttpPost("return")]
    public async Task<IActionResult> ReturnTool(
        [FromBody] ReturnToolRequest request
    )
    {
        var transaction =
            await _context.ToolTransactions
                .Include(t => t.Tool)
                .Include(t => t.Artisan)
                .FirstOrDefaultAsync(t =>
                    t.TransactionId ==
                        request.TransactionId &&
                    t.TransactionStatus == "Open"
                );

        if (transaction == null)
        {
            return NotFound(
                "Open tool transaction not found."
            );
        }


        // ========================================================
        // VALIDATE RETURNING USER
        // ========================================================

        var userExists =
            await _context.Users
                .AnyAsync(u =>
                    u.UserId ==
                        request.ReturnedByUserId &&
                    u.IsActive
                );

        if (!userExists)
        {
            return BadRequest(
                "The returning user is invalid or inactive."
            );
        }


        // ========================================================
        // VALIDATE RETURN CONDITION
        // ========================================================

        var returnConditionName =
            request.ReturnCondition?.Trim();

        if (string.IsNullOrWhiteSpace(
                returnConditionName
            ))
        {
            return BadRequest(
                "Return condition is required."
            );
        }

        var returnCondition =
            await _context.ToolConditions
                .AsNoTracking()
                .Include(c => c.ResultingStatus)
                .FirstOrDefaultAsync(c =>
                    c.ConditionName ==
                        returnConditionName &&
                    c.IsActive &&
                    c.AllowedOnReturn
                );

        if (returnCondition == null)
        {
            return BadRequest(
                $"The condition '{returnConditionName}' is not configured for tool return."
            );
        }


        // ========================================================
        // VALIDATE RESULTING STATUS
        // ========================================================

        if (
            !returnCondition
                .ResultingStatusId
                .HasValue ||
            returnCondition
                .ResultingStatus == null
        )
        {
            return BadRequest(
                $"The condition '{returnCondition.ConditionName}' does not have a resulting tool status configured."
            );
        }

        if (!returnCondition.ResultingStatus.IsActive)
        {
            return BadRequest(
                $"The resulting status '{returnCondition.ResultingStatus.StatusName}' is inactive."
            );
        }


        // ========================================================
        // CLOSE TRANSACTION
        // ========================================================

        transaction.ReturnedDate =
            DateTime.Now;

        transaction.ReturnCondition =
            returnCondition.ConditionName;

        transaction.ReturnedByUserId =
            request.ReturnedByUserId;

        transaction.TransactionStatus =
            "Returned";

        if (
            !string.IsNullOrWhiteSpace(
                request.Remarks
            )
        )
        {
            transaction.Remarks =
                request.Remarks;
        }


        // ========================================================
        // UPDATE TOOL FROM CONDITION MAPPING
        // ========================================================

        transaction.Tool.Condition =
            returnCondition.ConditionName;

        transaction.Tool.Status =
            returnCondition
                .ResultingStatus
                .StatusName;


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message =
                "Tool returned successfully.",

            transactionId =
                transaction.TransactionId,

            toolId =
                transaction.ToolId,

            tool =
                transaction.Tool.ToolName,

            artisan =
                transaction.Artisan.FullName,

            condition =
                transaction.Tool.Condition,

            status =
                transaction.Tool.Status
        });
    }
}


// ============================================================
// REQUEST MODELS
// ============================================================

public class BookOutToolRequest
{
    public int ToolId { get; set; }

    public int ArtisanId { get; set; }

    public int? ProjectId { get; set; }

    public DateTime? ExpectedReturnDate { get; set; }

    public string IssueCondition { get; set; } =
        "Good";

    public int IssuedByUserId { get; set; }

    public string? Remarks { get; set; }
}


public class ReturnToolRequest
{
    public int TransactionId { get; set; }

    public string ReturnCondition { get; set; } =
        "Good";

    public int ReturnedByUserId { get; set; }

    public string? Remarks { get; set; }
}