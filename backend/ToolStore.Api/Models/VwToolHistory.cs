using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class VwToolHistory
{
    public int TransactionId { get; set; }

    public string AssetNumber { get; set; } = null!;

    public string ToolName { get; set; } = null!;

    public string EmployeeNumber { get; set; } = null!;

    public string ArtisanName { get; set; } = null!;

    public string? ProjectNumber { get; set; }

    public string? ProjectName { get; set; }

    public DateTime IssuedDate { get; set; }

    public DateTime? ExpectedReturnDate { get; set; }

    public DateTime? ReturnedDate { get; set; }

    public string IssueCondition { get; set; } = null!;

    public string? ReturnCondition { get; set; }

    public string TransactionStatus { get; set; } = null!;

    public string? Remarks { get; set; }

    public string IssuedBy { get; set; } = null!;

    public string? ReturnedBy { get; set; }
}
