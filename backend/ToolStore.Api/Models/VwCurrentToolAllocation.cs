using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class VwCurrentToolAllocation
{
    public int ToolId { get; set; }

    public string AssetNumber { get; set; } = null!;

    public string ToolName { get; set; } = null!;

    public string? Category { get; set; }

    public string? SerialNumber { get; set; }

    public string? StoreLocation { get; set; }

    public string Condition { get; set; } = null!;

    public string Status { get; set; } = null!;

    public int? TransactionId { get; set; }

    public DateTime? IssuedDate { get; set; }

    public DateTime? ExpectedReturnDate { get; set; }

    public int? ArtisanId { get; set; }

    public string? EmployeeNumber { get; set; }

    public string? ArtisanName { get; set; }

    public string? Department { get; set; }

    public string? Trade { get; set; }

    public int? ProjectId { get; set; }

    public string? ProjectNumber { get; set; }

    public string? ProjectName { get; set; }

    public string? IssuedBy { get; set; }
}
