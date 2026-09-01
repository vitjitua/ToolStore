using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class Tool
{
    public int ToolId { get; set; }

    public string AssetNumber { get; set; } = null!;

    public string ToolName { get; set; } = null!;

    public string? Category { get; set; }

    public string? SerialNumber { get; set; }

    public string? StoreLocation { get; set; }

    public string Condition { get; set; } = null!;

    public string Status { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }

    public string? CreatedBy { get; set; }

    public virtual ToolTransaction? ToolTransaction { get; set; }
}
