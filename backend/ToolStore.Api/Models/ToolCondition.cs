namespace ToolStore.Api.Models;

public class ToolCondition
{
    public int ConditionId { get; set; }

    public string ConditionName { get; set; } = null!;

    public bool AllowedOnIssue { get; set; }

    public bool AllowedOnReturn { get; set; }

    public int? ResultingStatusId { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual ToolStatus? ResultingStatus { get; set; }
}