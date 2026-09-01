using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ToolStore.Api.Models;

namespace ToolStore.Api.Data;

public partial class EquipmentStoreContext : DbContext
{
    public EquipmentStoreContext(DbContextOptions<EquipmentStoreContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ToolStatus> ToolStatuses { get; set; }

    public virtual DbSet<ToolCondition> ToolConditions { get; set; }

    public virtual DbSet<Artisan> Artisans { get; set; }

    public virtual DbSet<Project> Projects { get; set; }

    public virtual DbSet<Tool> Tools { get; set; }

    public virtual DbSet<ToolTransaction> ToolTransactions { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<VwCurrentToolAllocation> VwCurrentToolAllocations { get; set; }

    public virtual DbSet<VwToolHistory> VwToolHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Artisan>(entity =>
        {
            entity.HasKey(e => e.ArtisanId).HasName("PK__Artisans__A82F3366A2DC9E0E");

            entity.HasIndex(e => e.FullName, "IX_Artisans_FullName");

            entity.HasIndex(e => e.EmployeeNumber, "UQ__Artisans__8D66359815074E09").IsUnique();

            entity.Property(e => e.ArtisanId).HasColumnName("ArtisanID");
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Department)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.EmployeeNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.FullName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Trade)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.ProjectId).HasName("PK__Projects__761ABED0F210D718");

            entity.HasIndex(e => e.ProjectNumber, "UQ__Projects__C66B6F6AB2B47567").IsUnique();

            entity.Property(e => e.ProjectId).HasColumnName("ProjectID");
            entity.Property(e => e.ProjectName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.ProjectNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Active");
        });

        modelBuilder.Entity<Tool>(entity =>
        {
            entity.HasKey(e => e.ToolId).HasName("PK__Tools__CC0CEBB1566D86C6");

            entity.HasIndex(e => e.AssetNumber, "IX_Tools_AssetNumber");

            entity.HasIndex(e => e.Status, "IX_Tools_Status");

            entity.HasIndex(e => e.AssetNumber, "UQ__Tools__856CE34BF7AFA323").IsUnique();

            entity.Property(e => e.ToolId).HasColumnName("ToolID");
            entity.Property(e => e.AssetNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Category)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Condition)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Good");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Available");
            entity.Property(e => e.StoreLocation)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.ToolName)
                .HasMaxLength(150)
                .IsUnicode(false);
        });

        modelBuilder.Entity<ToolStatus>(entity =>
{
    entity.HasKey(e => e.StatusId);

    entity.HasIndex(e => e.StatusName)
        .IsUnique();

    entity.Property(e => e.StatusId)
        .HasColumnName("StatusId");

    entity.Property(e => e.StatusName)
        .HasMaxLength(50)
        .IsUnicode(false);

    entity.Property(e => e.CanBookOut)
        .HasDefaultValue(false);

    entity.Property(e => e.IsActive)
        .HasDefaultValue(true);

    entity.Property(e => e.CreatedDate)
        .HasDefaultValueSql("(getdate())");
});

modelBuilder.Entity<ToolCondition>(entity =>
{
    entity.HasKey(e => e.ConditionId);

    entity.HasIndex(e => e.ConditionName)
        .IsUnique();

    entity.Property(e => e.ConditionId)
        .HasColumnName("ConditionId");

    entity.Property(e => e.ConditionName)
        .HasMaxLength(50)
        .IsUnicode(false);

    entity.Property(e => e.AllowedOnIssue)
        .HasDefaultValue(false);

    entity.Property(e => e.AllowedOnReturn)
        .HasDefaultValue(false);

    entity.Property(e => e.ResultingStatusId)
        .HasColumnName("ResultingStatusId");

    entity.Property(e => e.IsActive)
        .HasDefaultValue(true);

    entity.Property(e => e.CreatedDate)
        .HasDefaultValueSql("(getdate())");

    entity.HasOne(e => e.ResultingStatus)
        .WithMany()
        .HasForeignKey(e => e.ResultingStatusId)
        .OnDelete(DeleteBehavior.Restrict)
        .HasConstraintName("FK_ToolConditions_ToolStatuses");
});

        modelBuilder.Entity<ToolTransaction>(entity =>
        {
            entity.HasKey(e => e.TransactionId).HasName("PK__ToolTran__55433A4B1A82636B");

            entity.HasIndex(e => e.ArtisanId, "IX_ToolTransactions_ArtisanID");

            entity.HasIndex(e => e.IssuedDate, "IX_ToolTransactions_IssuedDate");

            entity.HasIndex(e => e.ProjectId, "IX_ToolTransactions_ProjectID");

            entity.HasIndex(e => e.ToolId, "UX_ToolTransactions_OneOpenTransactionPerTool")
                .IsUnique()
                .HasFilter("([TransactionStatus]='Open')");

            entity.Property(e => e.TransactionId).HasColumnName("TransactionID");
            entity.Property(e => e.ArtisanId).HasColumnName("ArtisanID");
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IssueCondition)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Good");
            entity.Property(e => e.IssuedByUserId).HasColumnName("IssuedByUserID");
            entity.Property(e => e.IssuedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.ProjectId).HasColumnName("ProjectID");
            entity.Property(e => e.Remarks)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.ReturnCondition)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.ReturnedByUserId).HasColumnName("ReturnedByUserID");
            entity.Property(e => e.ToolId).HasColumnName("ToolID");
            entity.Property(e => e.TransactionStatus)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Open");

            entity.HasOne(d => d.Artisan).WithMany(p => p.ToolTransactions)
                .HasForeignKey(d => d.ArtisanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ToolTransactions_Artisans");

            entity.HasOne(d => d.IssuedByUser).WithMany(p => p.ToolTransactionIssuedByUsers)
                .HasForeignKey(d => d.IssuedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ToolTransactions_IssuedBy");

            entity.HasOne(d => d.Project).WithMany(p => p.ToolTransactions)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("FK_ToolTransactions_Projects");

            entity.HasOne(d => d.ReturnedByUser).WithMany(p => p.ToolTransactionReturnedByUsers)
                .HasForeignKey(d => d.ReturnedByUserId)
                .HasConstraintName("FK_ToolTransactions_ReturnedBy");

            entity.HasOne(d => d.Tool).WithOne(p => p.ToolTransaction)
                .HasForeignKey<ToolTransaction>(d => d.ToolId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ToolTransactions_Tools");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCAC776FB98A");

            entity.HasIndex(e => e.EmailAddress, "UQ__Users__49A147406A977C4F").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DisplayName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.EmailAddress)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.EmployeeNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<VwCurrentToolAllocation>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_CurrentToolAllocation");

            entity.Property(e => e.ArtisanId).HasColumnName("ArtisanID");
            entity.Property(e => e.ArtisanName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.AssetNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Category)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Condition)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.Department)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.EmployeeNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IssuedBy)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.ProjectId).HasColumnName("ProjectID");
            entity.Property(e => e.ProjectName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.ProjectNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.StoreLocation)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.ToolId).HasColumnName("ToolID");
            entity.Property(e => e.ToolName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.Trade)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.TransactionId).HasColumnName("TransactionID");
        });

        modelBuilder.Entity<VwToolHistory>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ToolHistory");

            entity.Property(e => e.ArtisanName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.AssetNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.EmployeeNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IssueCondition)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.IssuedBy)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.ProjectName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.ProjectNumber)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Remarks)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.ReturnCondition)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.ReturnedBy)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.ToolName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.TransactionId).HasColumnName("TransactionID");
            entity.Property(e => e.TransactionStatus)
                .HasMaxLength(30)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
