using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class Artisan
{
    public int ArtisanId { get; set; }

    public string EmployeeNumber { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? Department { get; set; }

    public string? Trade { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual ICollection<ToolTransaction> ToolTransactions { get; set; } = new List<ToolTransaction>();
}
