using System;
using System.Collections.Generic;

namespace ToolStore.Api.Models;

public partial class User
{
    public int UserId { get; set; }

    public string? EmployeeNumber { get; set; }

    public string DisplayName { get; set; } = null!;

    public string EmailAddress { get; set; } = null!;

    public string Role { get; set; } = null!;
    
    public string? PasswordHash { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual ICollection<ToolTransaction> ToolTransactionIssuedByUsers { get; set; } = new List<ToolTransaction>();

    public virtual ICollection<ToolTransaction> ToolTransactionReturnedByUsers { get; set; } = new List<ToolTransaction>();
}
