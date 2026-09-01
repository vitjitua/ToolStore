using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class Project
{
    public int ProjectId { get; set; }

    public string ProjectNumber { get; set; } = null!;

    public string ProjectName { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public virtual ICollection<ToolTransaction> ToolTransactions { get; set; } = new List<ToolTransaction>();
}
