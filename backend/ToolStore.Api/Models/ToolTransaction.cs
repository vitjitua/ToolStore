using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class ToolTransaction
{
    public int TransactionId { get; set; }

    public int ToolId { get; set; }

    public int ArtisanId { get; set; }

    public int? ProjectId { get; set; }

    public DateTime IssuedDate { get; set; }

    public DateTime? ExpectedReturnDate { get; set; }

    public DateTime? ReturnedDate { get; set; }

    public string IssueCondition { get; set; } = null!;

    public string? ReturnCondition { get; set; }

    public int IssuedByUserId { get; set; }

    public int? ReturnedByUserId { get; set; }

    public string TransactionStatus { get; set; } = null!;

    public string? Remarks { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual Artisan Artisan { get; set; } = null!;

    public virtual User IssuedByUser { get; set; } = null!;

    public virtual Project? Project { get; set; }

    public virtual User? ReturnedByUser { get; set; }

    public virtual Tool Tool { get; set; } = null!;
}
